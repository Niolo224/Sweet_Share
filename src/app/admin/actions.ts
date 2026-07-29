"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, checkPassword, startSession, endSession } from "@/lib/auth";
import { storeUpload } from "@/lib/upload";
import { setSetting } from "@/lib/settings";
import { slugify, formatMoney, formatDate } from "@/lib/utils";
import { getStripe, ACH_THRESHOLD_CENTS, siteUrl } from "@/lib/stripe";
import { sendEmail, emailShell } from "@/lib/email";
import {
  refundToCard,
  generateCode,
  MIN_GIFT_CENTS,
  MAX_GIFT_CENTS,
} from "@/lib/giftcards";

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

  // Cancelling an order hands any gift card value back to the guest.
  if (status === "cancelled") await refundToCard(id);

  revalidatePath("/admin/orders");
  revalidatePath("/admin/gift-cards");
}

export async function setPaymentStatusAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  const paymentStatus = text(form, "paymentStatus");
  if (!id || !paymentStatus) return;
  if (!["unpaid", "processing", "paid", "refunded"].includes(paymentStatus)) return;

  await prisma.order.update({ where: { id }, data: { paymentStatus } });
  revalidatePath("/admin/orders");
}

/**
 * Turn a confirmed order into a Stripe Checkout link and email it to the guest.
 *
 * Deliberately not part of the public checkout: we confirm we can bake it
 * before anyone is charged. That also means a cancelled order costs nothing,
 * since Stripe does not return its fee on a refund.
 */
export async function sendPaymentLinkAction(form: FormData) {
  await requireAdmin();

  const id = text(form, "id");
  if (!id) return;

  const stripe = getStripe();
  if (!stripe) {
    redirect("/admin/orders?problem=Stripe+is+not+configured+on+the+server.");
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) redirect("/admin/orders?problem=That+order+no+longer+exists.");
  if (order.paymentStatus === "paid") {
    redirect(`/admin/orders?problem=${order.orderNumber}+is+already+paid.`);
  }

  const lineItems = order.items.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency: "usd",
      unit_amount: item.unitPriceCents,
      product_data: { name: item.nameSnapshot },
    },
  }));

  if (order.deliveryFeeCents > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: order.deliveryFeeCents,
        product_data: { name: "Local delivery" },
      },
    });
  }

  const base = siteUrl();
  const sessionOptions = {
    mode: "payment" as const,
    line_items: lineItems,
    customer_email: order.email,
    client_reference_id: order.orderNumber,
    metadata: { orderId: order.id, orderNumber: order.orderNumber },
    // Copied onto the charge so a refund webhook can find its way home.
    payment_intent_data: {
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
      description: `Sweet Share order ${order.orderNumber}`,
    },
    success_url: `${base}/order/paid?number=${encodeURIComponent(order.orderNumber)}`,
    cancel_url: `${base}/order/thank-you?number=${encodeURIComponent(order.orderNumber)}`,
  };

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      ...sessionOptions,
      // Bank debit only earns its keep on the larger catering orders.
      ...(order.totalCents >= ACH_THRESHOLD_CENTS
        ? { payment_method_types: ["card" as const, "us_bank_account" as const] }
        : {}),
    });
  } catch (error) {
    console.error("[admin/sendPaymentLink]", error);
    // ACH has to be switched on in the Stripe dashboard. If it is not, do not
    // strand the order — fall back to cards so the guest can still pay.
    try {
      session = await stripe.checkout.sessions.create(sessionOptions);
    } catch (fallbackError) {
      console.error("[admin/sendPaymentLink] fallback", fallbackError);
      redirect(
        "/admin/orders?problem=Stripe+refused+the+request.+Check+the+server+log+and+your+API+key.",
      );
    }
  }

  if (!session?.url) {
    redirect("/admin/orders?problem=Stripe+returned+no+checkout+link.");
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripeSessionId: session.id,
      status: order.status === "pending" ? "confirmed" : order.status,
    },
  });

  await sendEmail({
    to: order.email,
    replyTo: process.env.ORDER_NOTIFICATION_EMAIL,
    subject: `Your Sweet Share order is confirmed — ${order.orderNumber}`,
    html: emailShell(
      `Good news, ${order.customerName.split(" ")[0]}`,
      `<p>We can absolutely make this, and it is booked into the kitchen for
       <strong>${formatDate(order.requestedDate)}</strong>${
         order.timeWindow ? `, ${order.timeWindow}` : ""
       }.</p>
       <p>Whenever you are ready, here is your secure payment link:</p>
       <p style="margin:22px 0;">
         <a href="${session.url}"
            style="display:inline-block;background:#ee6f94;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-family:Arial,sans-serif;font-size:14px;letter-spacing:.08em;text-transform:uppercase;">
           Pay ${formatMoney(order.totalCents)}
         </a>
       </p>
       <p style="font-size:13px;color:#a37c93;">The link is handled entirely by
       Stripe — we never see your card details. It stays open for 24 hours; if
       it lapses, just reply and we will send a fresh one.</p>
       <p>Thank you for letting us bake for you.</p>`,
    ),
  });

  revalidatePath("/admin/orders");
  redirect(`/admin/orders?sent=${encodeURIComponent(order.orderNumber)}`);
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

// ═══════════════════════════════════════════════════════════
//  Gift cards
// ═══════════════════════════════════════════════════════════

/** Issue a card by hand — an apology, a prize, a gift to a family. */
export async function issueGiftCardAction(
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const amount = num(form, "amount");
  if (amount == null || amount <= 0) {
    return { error: "How much should the card be worth?" };
  }

  const cents = Math.round(amount * 100);
  if (cents < MIN_GIFT_CENTS || cents > MAX_GIFT_CENTS) {
    return {
      error: `Comped cards must be between ${formatMoney(MIN_GIFT_CENTS)} and ${formatMoney(MAX_GIFT_CENTS)}.`,
    };
  }

  const recipientEmail = text(form, "recipientEmail");
  const recipientName = text(form, "recipientName");
  const message = text(form, "message");

  try {
    const card = await prisma.giftCard.create({
      data: {
        code: await generateCode(),
        initialCents: cents,
        balanceCents: cents,
        recipientName,
        recipientEmail,
        message,
        // Comped cards skip the pending state — there is no payment to wait on.
        status: "active",
        activatedAt: new Date(),
        isComped: true,
      },
    });

    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: "A gift from Sweet Share",
        html: emailShell(
          recipientName ? `For you, ${recipientName}` : "A gift for you",
          `${message ? `<p style="font-style:italic;">“${message}”</p>` : ""}
           <p style="margin:24px 0;padding:20px;border:1px dashed #f9c4d4;border-radius:14px;text-align:center;">
             <span style="display:block;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#ee6f94;">Your code</span>
             <strong style="display:block;margin-top:8px;font-size:24px;letter-spacing:.12em;color:#45213a;">${card.code}</strong>
             <span style="display:block;margin-top:8px;font-size:14px;color:#6d3f5c;">${formatMoney(cents)}</span>
           </p>
           <p>Enter it at checkout on any order. It never expires, and anything
           you do not spend stays on the card.</p>`,
        ),
      });
    }
  } catch (error) {
    console.error("[admin/issueGiftCard]", error);
    return { error: "Could not issue that card." };
  }

  revalidatePath("/admin/gift-cards");
  return { success: "Card issued." };
}

export async function voidGiftCardAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  await prisma.giftCard.update({
    where: { id },
    data: { status: "void" },
  });
  revalidatePath("/admin/gift-cards");
}

export async function restoreGiftCardAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;
  const card = await prisma.giftCard.findUnique({ where: { id } });
  if (!card) return;
  await prisma.giftCard.update({
    where: { id },
    data: { status: card.balanceCents > 0 ? "active" : "spent" },
  });
  revalidatePath("/admin/gift-cards");
}

// ═══════════════════════════════════════════════════════════
//  The club
// ═══════════════════════════════════════════════════════════

/**
 * Cancel a membership. Stripe is the source of truth for billing, so we tell
 * it first and let the webhook write our record — that way the two can never
 * disagree about whether someone is still being charged.
 */
export async function cancelSubscriptionAction(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;

  const subscription = await prisma.subscription.findUnique({ where: { id } });
  if (!subscription) return;

  const stripe = getStripe();
  if (stripe && subscription.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } catch (error) {
      console.error("[admin/cancelSubscription]", error);
    }
  }

  await prisma.subscription.update({
    where: { id },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  revalidatePath("/admin/club");
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
