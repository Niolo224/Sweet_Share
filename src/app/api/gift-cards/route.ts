import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { getStripe, siteUrl } from "@/lib/stripe";
import { generateCode, MIN_GIFT_CENTS, MAX_GIFT_CENTS } from "@/lib/giftcards";
import { formatMoney } from "@/lib/utils";

const schema = z.object({
  amountCents: z.coerce.number().int().min(MIN_GIFT_CENTS).max(MAX_GIFT_CENTS),
  purchaserName: z.string().min(1, "Please tell us your name.").max(120),
  purchaserEmail: z.string().email("We need your email for the receipt."),
  recipientName: z.string().max(120).optional().nullable(),
  recipientEmail: z
    .string()
    .email("That recipient email does not look right.")
    .optional()
    .or(z.literal(""))
    .nullable(),
  message: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "giftcards"), {
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
          "Gift cards are not available just now. Please write to us and we will sort it out by hand.",
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

  try {
    // The card exists but is inert until Stripe confirms the money.
    const card = await prisma.giftCard.create({
      data: {
        code: await generateCode(),
        initialCents: data.amountCents,
        balanceCents: data.amountCents,
        purchaserName: data.purchaserName.trim(),
        purchaserEmail: data.purchaserEmail.trim().toLowerCase(),
        recipientName: data.recipientName?.trim() || null,
        recipientEmail: data.recipientEmail?.trim().toLowerCase() || null,
        message: data.message?.trim() || null,
        status: "pending",
      },
    });

    const base = siteUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Nothing has to be baked, so unlike a dessert order this is paid
      // straight away.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: data.amountCents,
            product_data: {
              name: `Sweet Share gift card — ${formatMoney(data.amountCents)}`,
              description: data.recipientName
                ? `A gift for ${data.recipientName}`
                : "Redeemable against anything we bake.",
            },
          },
        },
      ],
      customer_email: data.purchaserEmail.trim().toLowerCase(),
      metadata: { giftCardId: card.id, kind: "gift_card" },
      payment_intent_data: {
        metadata: { giftCardId: card.id, kind: "gift_card" },
        description: `Sweet Share gift card ${card.code}`,
      },
      success_url: `${base}/gift-cards/sent?id=${card.id}`,
      cancel_url: `${base}/gift-cards?cancelled=1`,
    });

    await prisma.giftCard.update({
      where: { id: card.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe returned no checkout link." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[gift-cards]", error);
    return NextResponse.json(
      { error: "We could not start that purchase. Please try again shortly." },
      { status: 500 },
    );
  }
}
