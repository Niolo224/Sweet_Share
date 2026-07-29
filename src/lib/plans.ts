/**
 * The Sweet Share Club.
 *
 * Prices live here rather than in the database because changing a subscription
 * price is not a content edit — existing members keep the price they signed up
 * at, and Stripe holds that on their subscription. Editing this file changes
 * what *new* members pay; it does not touch anyone already subscribed.
 */

export type Plan = {
  key: string;
  name: string;
  tagline: string;
  priceCents: number;
  /** What actually goes in the box, for the kitchen and the guest alike. */
  contents: string[];
  /** Roughly what the same thing would cost bought one box at a time. */
  compareAtCents: number;
  imageKey: "chocolateChipCookies" | "doubleChocolateCookies" | "cashewCheesecake";
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    key: "little-box",
    name: "The Little Box",
    tagline: "Six cookies, once a month, for one person who deserves them",
    priceCents: 1500,
    contents: ["6 cookies, alternating between our two kinds each month"],
    compareAtCents: 1600,
    imageKey: "chocolateChipCookies",
  },
  {
    key: "cookie-club",
    name: "The Cookie Club",
    tagline: "A dozen of each, every month — enough to actually share",
    priceCents: 3000,
    contents: [
      "6 Everyday Chocolate Chip",
      "6 Double Chocolate Sea Salt",
      "First pick of anything new we are testing",
    ],
    compareAtCents: 3400,
    imageKey: "doubleChocolateCookies",
    featured: true,
  },
  {
    key: "full-table",
    name: "The Full Table",
    tagline: "A whole cheesecake and a dozen cookies. For a house that hosts.",
    priceCents: 6400,
    contents: [
      "1 Cloud Cheesecake, 8-inch",
      "6 Everyday Chocolate Chip",
      "6 Double Chocolate Sea Salt",
      "Free local delivery, every month",
    ],
    compareAtCents: 8000,
    imageKey: "cashewCheesecake",
  },
];

export function findPlan(key: string) {
  return PLANS.find((plan) => plan.key === key);
}

/** Every club box is baked on the same rhythm as a normal order. */
export const CLUB_LEAD_TIME_DAYS = 4;
