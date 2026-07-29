import Stripe from "stripe";

/**
 * Stripe is optional. Without STRIPE_SECRET_KEY the shop still runs exactly as
 * before — the owner simply confirms orders and arranges payment by hand.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, {
      // Identifies this integration in Stripe's logs — helps their support
      // and ours when something looks wrong.
      appInfo: { name: "Sweet Share", url: "https://sweetshare.shop" },
    });
  }
  return cached;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Above this amount we also offer bank debit at checkout.
 *
 * Card costs 2.9% + 30¢ with no ceiling; ACH costs 0.8% capped at $5. On a
 * $600 catering order that is $17.70 versus $5. Below a couple of hundred
 * dollars the saving is not worth asking a guest to type bank details, and
 * ACH takes days to settle — so cards stay the default for everyday boxes.
 */
export const ACH_THRESHOLD_CENTS = 20_000;

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}
