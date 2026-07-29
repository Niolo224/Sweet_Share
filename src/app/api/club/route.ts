import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { getStripe, siteUrl } from "@/lib/stripe";
import { findPlan } from "@/lib/plans";

const schema = z.object({
  plan: z.string().min(1),
  customerName: z.string().min(1, "Please tell us your name.").max(120),
  email: z.string().email("We need a working email address."),
  phone: z.string().max(40).optional().nullable(),
  fulfillment: z.enum(["pickup", "delivery"]),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(24).optional().nullable(),
  dietaryNotes: z.string().max(800).optional().nullable(),
  joinList: z.boolean().optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "club"), {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again in a few minutes." },
      { status: 429 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      {
        error:
          "The club is not taking members online just now. Please write to us and we will set you up by hand.",
      },
      { status: 503 },
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
  // Never trust a price from the browser.
  const plan = findPlan(data.plan);
  if (!plan) {
    return NextResponse.json({ error: "We do not know that plan." }, { status: 400 });
  }

  if (data.fulfillment === "delivery" && !data.address?.trim()) {
    return NextResponse.json(
      { error: "Please give us a delivery address." },
      { status: 400 },
    );
  }

  const email = data.email.trim().toLowerCase();

  try {
    // One live membership per address keeps the kitchen sane.
    const existing = await prisma.subscription.findFirst({
      where: { email, status: { in: ["active", "past_due", "paused"] } },
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            "You already have a club membership on this email. Manage it from the link in any of your box emails, or write to us.",
        },
        { status: 409 },
      );
    }

    const subscription = await prisma.subscription.create({
      data: {
        customerName: data.customerName.trim(),
        email,
        phone: data.phone?.trim() || null,
        plan: plan.key,
        priceCents: plan.priceCents,
        fulfillment: data.fulfillment,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        postalCode: data.postalCode?.trim() || null,
        dietaryNotes: data.dietaryNotes?.trim() || null,
        status: "pending",
      },
    });

    const base = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      // Inline recurring price — no Product or Price has to be created in the
      // dashboard first, so the club works the moment the keys are set.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.priceCents,
            recurring: { interval: "month" },
            product_data: {
              name: `Sweet Share Club — ${plan.name}`,
              description: plan.contents.join(" · "),
            },
          },
        },
      ],
      customer_email: email,
      metadata: { subscriptionId: subscription.id, kind: "club", plan: plan.key },
      subscription_data: {
        metadata: { subscriptionId: subscription.id, plan: plan.key },
      },
      success_url: `${base}/club/welcome?id=${subscription.id}`,
      cancel_url: `${base}/club?cancelled=1`,
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { stripeSessionId: session.id },
    });

    if (data.joinList) {
      await prisma.subscriber.upsert({
        where: { email },
        create: { email, name: data.customerName.trim(), source: "club" },
        update: { unsubscribedAt: null },
      });
    }

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe returned no checkout link." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[club]", error);
    return NextResponse.json(
      { error: "We could not start that just now. Please try again shortly." },
      { status: 500 },
    );
  }
}
