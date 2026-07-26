import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { sendEmail, emailShell } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1, "Please tell us your name.").max(80),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  location: z.string().max(60).optional().nullable(),
  dessertId: z.string().optional().nullable(),
  title: z.string().max(90).optional().nullable(),
  body: z
    .string()
    .min(10, "Please write a little more — ten characters at least.")
    .max(1500),
  rating: z.coerce.number().int().min(1).max(5),
  joinList: z.boolean().optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "reviews"), {
    limit: 3,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Thank you — you have already left a few. Give it a moment." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const email = data.email?.trim().toLowerCase() || null;

  try {
    // Only accept a dessert id that actually exists.
    let dessertId: string | null = null;
    if (data.dessertId) {
      const dessert = await prisma.dessert.findUnique({
        where: { id: data.dessertId },
        select: { id: true },
      });
      dessertId = dessert?.id ?? null;
    }

    // If this email has ordered from us before, mark the review verified.
    const hasOrdered = email
      ? (await prisma.order.count({ where: { email } })) > 0
      : false;

    await prisma.review.create({
      data: {
        name: data.name.trim(),
        email,
        location: data.location?.trim() || null,
        title: data.title?.trim() || null,
        body: data.body.trim(),
        rating: data.rating,
        dessertId,
        isVerified: hasOrdered,
        status: "pending",
      },
    });

    if (data.joinList && email) {
      await prisma.subscriber.upsert({
        where: { email },
        create: { email, name: data.name.trim(), source: "testimonial" },
        update: { unsubscribedAt: null },
      });
    }

    const notify = process.env.ORDER_NOTIFICATION_EMAIL;
    if (notify) {
      await sendEmail({
        to: notify,
        subject: `New review awaiting approval — ${data.rating}★ from ${data.name}`,
        html: emailShell(
          "A new review is waiting",
          `<p><strong>${data.name}</strong> left ${data.rating} stars.</p>
           <p>${data.title ? `<strong>${data.title}</strong><br/>` : ""}${data.body}</p>
           <p>Approve or reject it in your dashboard under Reviews.</p>`,
        ),
      });
    }

    return NextResponse.json({
      message:
        "Thank you — we read every one of these. It will appear once we have looked it over, usually within a day.",
    });
  } catch (error) {
    console.error("[reviews]", error);
    return NextResponse.json(
      { error: "We could not save that just now. Please try again shortly." },
      { status: 500 },
    );
  }
}
