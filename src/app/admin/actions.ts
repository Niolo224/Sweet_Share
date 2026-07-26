"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, checkPassword, startSession, endSession } from "@/lib/auth";
import { storeUpload } from "@/lib/upload";
import { setSetting } from "@/lib/settings";
import { slugify } from "@/lib/utils";

export type ActionState = { error?: string; success?: string } | null;

/** Read a text field, returning null for blanks so the database stays clean. */
function text(form: FormData, key: string): string | null {
  const value = form.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function num(form: FormData, key: string): number | null {
  const value = text(form, key);
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "true";
}

/** Turn a textarea of "name — note" lines into our JSON ingredient list. */
function parseIngredientLines(raw: string | null) {
  if (!raw) return "[]";
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split(/\s+[—–-]\s+/);
      const note = rest.join(" — ").trim();
      return note ? { name: name.trim(), note } : { name: name.trim() };
    });
  return JSON.stringify(lines);
}

function parseCommaList(raw: string | null) {
  if (!raw) return "[]";
  return JSON.stringify(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

/** Save an uploaded image if one was chosen, else keep the pasted URL. */
async function resolveImage(
  form: FormData,
  fileKey: string,
  urlKey: string,
): Promise<{ url: string | null; error?: string }> {
  const file = form.get(fileKey);
  if (file instanceof File && file.size > 0) {
    const result = await storeUpload(file);
    if (!result.ok) return { url: null, error: result.error };
    return { url: result.url };
  }
  return { url: text(form, urlKey) };
}

// ═══════════════════════════════════════════════════════════
//  Session
// ═══════════════════════════════════════════════════════════

export async function signInAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  const password = form.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return { error: "Please enter your password." };
  }
  if (!process.env.ADMIN_PASSWORD) {
    return {
      error:
        "No ADMIN_PASSWORD is set on the server. Add one to your .env file and restart.",
    };
  }
  if (!checkPassword(password)) {
    return { error: "That password is not right." };
  }
  await startSession();
  redirect("/admin");
}

export async function signOutAction() {
  await endSession();
  redirect("/admin/login");
}

// ═══════════════════════════════════════════════════════════
//  Desserts
// ═══════════════════════════════════════════════════════════

export async function saveDessertAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = text(form, "id");
  const name = text(form, "name");
  if (!name) return { error: "A dessert needs a name." };

  const priceDollars = num(form, "price");
  if (priceDollars == null || priceDollars < 0) {
    return { error: "Please give a valid price." };
  }

  const image = await resolveImage(form, "imageFile", "imageUrl");
  if (image.error) return { error: image.error };

  const data = {
    slug: text(form, "slug") ?? slugify(name),
    name,
    tagline: text(form, "tagline") ?? "",
    description: text(form, "description") ?? "",
    story: text(form, "story"),
    category: text(form, "category") ?? "cakes",
    priceCents: Math.round(priceDollars * 100),
    unitLabel: text(form, "unitLabel") ?? "each",
    imageUrl: image.url,
    imageAlt: text(form, "imageAlt"),
    ingredients: parseIngredientLines(text(form, "ingredients")),
    allergens: parseCommaList(text(form, "allergens")),
    badges: parseCommaList(text(form, "badges")),
    servingSize: text(form, "servingSize"),
    calories: num(form, "calories"),
    totalCarbsG: num(form, "totalCarbsG"),
    fiberG: num(form, "fiberG"),
    sugarsG: num(form, "sugarsG"),
    addedSugarsG: num(form, "addedSugarsG") ?? 0,
    sugarAlcoholG: num(form, "sugarAlcoholG") ?? 0,
    proteinG: num(form, "proteinG"),
    fatG: num(form, "fatG"),
    satFatG: num(form, "satFatG"),
    sodiumMg: num(form, "sodiumMg"),
    sweetener: text(form, "sweetener"),
    glycemicLoad: num(form, "glycemicLoad"),
    glycemicNote: text(form, "glycemicNote"),
    leadTimeDays: Math.max(0, Math.round(num(form, "leadTimeDays") ?? 2)),
    servesText: text(form, "servesText"),
    scripture: text(form, "scripture"),
    scriptureRef: text(form, "scriptureRef"),
    isFeatured: bool(form, "isFeatured"),
    isAvailable: bool(form, "isAvailable"),
    sortOrder: Math.round(num(form, "sortOrder") ?? 0),
  };

  try {
    if (id) {
      await prisma.dessert.update({ where: { id }, data });
    } else {
      await prisma.dessert.create({ data });
    }
  } catch (error) {
    console.error("[admin/saveDessert]", error);
    return {
      error:
        "Could not save. That web address (slug) may already belong to another dessert.",
    };
  }

  revalidatePath("/admin/desserts");
  revalidatePath("/gallery");
  revalidatePath("/");
  redirect("/admin/desserts?saved=1");
}

export async function deleteDessertAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  await prisma.dessert.delete({ where: { id } });
  revalidatePath("/admin/desserts");
  revalidatePath("/gallery");
}

export async function toggleDessertAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  const dessert = await prisma.dessert.findUnique({ where: { id } });
  if (!dessert) return;
  await prisma.dessert.update({
    where: { id },
    data: { isAvailable: !dessert.isAvailable },
  });
  revalidatePath("/admin/desserts");
  revalidatePath("/gallery");
}

// ═══════════════════════════════════════════════════════════
//  Menus
// ═══════════════════════════════════════════════════════════

export async function saveMenuAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = text(form, "id");
  const title = text(form, "title");
  if (!title) return { error: "A menu needs a title." };

  const cover = await resolveImage(form, "coverFile", "coverImageUrl");
  if (cover.error) return { error: cover.error };

  const pdf = await resolveImage(form, "pdfFile", "pdfUrl");
  if (pdf.error) return { error: pdf.error };

  const makeActive = bool(form, "isActive");

  const data = {
    slug: text(form, "slug") ?? slugify(title),
    title,
    subtitle: text(form, "subtitle"),
    description: text(form, "description"),
    season: text(form, "season"),
    coverImageUrl: cover.url,
    pdfUrl: pdf.url,
    isActive: makeActive,
  };

  try {
    // Only one menu is ever the live one.
    if (makeActive) {
      await prisma.menu.updateMany({ data: { isActive: false } });
    }

    const menu = id
      ? await prisma.menu.update({ where: { id }, data })
      : await prisma.menu.create({ data });

    // The checkboxes tell us exactly which desserts belong on this menu.
    const chosen = form.getAll("dessertIds").filter((v): v is string => typeof v === "string");
    await prisma.menuItem.deleteMany({ where: { menuId: menu.id } });
    if (chosen.length > 0) {
      await prisma.menuItem.createMany({
        data: chosen.map((dessertId, index) => ({
          menuId: menu.id,
          dessertId,
          sortOrder: index,
        })),
      });
    }
  } catch (error) {
    console.error("[admin/saveMenu]", error);
    return { error: "Could not save that menu. Check the web address is unique." };
  }

  revalidatePath("/admin/menus");
  revalidatePath("/gallery");
  redirect("/admin/menus?saved=1");
}

export async function publishMenuAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  await prisma.menu.updateMany({ data: { isActive: false } });
  await prisma.menu.update({
    where: { id },
    data: { isActive: true, publishedAt: new Date() },
  });
  revalidatePath("/admin/menus");
  revalidatePath("/gallery");
}

export async function deleteMenuAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  await prisma.menu.delete({ where: { id } });
  revalidatePath("/admin/menus");
  revalidatePath("/gallery");
}

// ═══════════════════════════════════════════════════════════
//  Gatherings
// ═══════════════════════════════════════════════════════════

export async function saveEventAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const id = text(form, "id");
  const title = text(form, "title");
  if (!title) return { error: "A gathering needs a title." };

  const startsAtRaw = text(form, "startsAt");
  if (!startsAtRaw) return { error: "When does it start?" };
  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) {
    return { error: "That start time did not make sense." };
  }

  const endsAtRaw = text(form, "endsAt");
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return { error: "That end time did not make sense." };
  }
  if (endsAt && endsAt < startsAt) {
    return { error: "The gathering cannot end before it begins." };
  }

  const image = await resolveImage(form, "imageFile", "imageUrl");
  if (image.error) return { error: image.error };

  const priceDollars = num(form, "price");

  const data = {
    slug: text(form, "slug") ?? slugify(title),
    title,
    description: text(form, "description") ?? "",
    startsAt,
    endsAt,
    location: text(form, "location") ?? "The Sweet Share Kitchen",
    address: text(form, "address"),
    imageUrl: image.url,
    ticketUrl: text(form, "ticketUrl"),
    capacity: num(form, "capacity") != null ? Math.round(num(form, "capacity")!) : null,
    priceCents: priceDollars != null ? Math.round(priceDollars * 100) : 0,
    isPublished: bool(form, "isPublished"),
  };

  try {
    if (id) {
      await prisma.event.update({ where: { id }, data });
    } else {
      await prisma.event.create({ data });
    }
  } catch (error) {
    console.error("[admin/saveEvent]", error);
    return { error: "Could not save that gathering. Check the web address is unique." };
  }

  revalidatePath("/admin/events");
  revalidatePath("/gatherings");
  revalidatePath("/");
  redirect("/admin/events?saved=1");
}

export async function deleteEventAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  await prisma.event.delete({ where: { id } });
  revalidatePath("/admin/events");
  revalidatePath("/gatherings");
}

// ═══════════════════════════════════════════════════════════
//  Reviews
// ═══════════════════════════════════════════════════════════

export async function setReviewStatusAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const status = text(form, "status");
  if (!id || !status) return;
  if (!["pending", "approved", "rejected"].includes(status)) return;

  await prisma.review.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reviews");
  revalidatePath("/testimonials");
  revalidatePath("/");
}

export async function toggleReviewFeaturedAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return;
  await prisma.review.update({
    where: { id },
    data: { isFeatured: !review.isFeatured },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/testimonials");
  revalidatePath("/");
}

export async function replyToReviewAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  await prisma.review.update({
    where: { id },
    data: { reply: text(form, "reply") },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/testimonials");
}

export async function deleteReviewAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
  revalidatePath("/testimonials");
}

// ═══════════════════════════════════════════════════════════
//  Orders
// ═══════════════════════════════════════════════════════════

export async function setOrderStatusAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const status = text(form, "status");
  if (!id || !status) return;

  const allowed = ["pending", "confirmed", "baking", "ready", "fulfilled", "cancelled"];
  if (!allowed.includes(status)) return;

  await prisma.order.update({ where: { id }, data: { status } });
  revalidatePath("/admin/orders");
}

export async function setPaymentStatusAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const paymentStatus = text(form, "paymentStatus");
  if (!id || !paymentStatus) return;
  if (!["unpaid", "paid", "refunded"].includes(paymentStatus)) return;

  await prisma.order.update({ where: { id }, data: { paymentStatus } });
  revalidatePath("/admin/orders");
}

// ═══════════════════════════════════════════════════════════
//  Messages, subscribers, settings
// ═══════════════════════════════════════════════════════════

export async function markMessageReadAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  const message = await prisma.message.findUnique({ where: { id } });
  if (!message) return;
  await prisma.message.update({
    where: { id },
    data: { isRead: !message.isRead },
  });
  revalidatePath("/admin/messages");
}

export async function deleteMessageAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  await prisma.message.delete({ where: { id } });
  revalidatePath("/admin/messages");
}

export async function removeSubscriberAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  await prisma.subscriber.update({
    where: { id },
    data: { unsubscribedAt: new Date() },
  });
  revalidatePath("/admin/subscribers");
}

export async function saveSettingsAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const entries = Array.from(form.entries()).filter(
    ([key, value]) => key !== "$ACTION_ID" && typeof value === "string",
  ) as Array<[string, string]>;

  try {
    for (const [key, value] of entries) {
      await setSetting(key, value.trim());
    }
  } catch (error) {
    console.error("[admin/saveSettings]", error);
    return { error: "Could not save those settings." };
  }

  revalidatePath("/", "layout");
  return { success: "Saved. Your site is updated." };
}
