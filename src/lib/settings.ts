import { prisma } from "./prisma";

/**
 * Copy the owner can edit from the dashboard without touching code.
 * Anything missing from the database falls back to these defaults.
 */
export const SETTING_DEFAULTS = {
  announcement:
    "Free local delivery on advance orders over $60 — every box shared feeds a neighbour.",
  heroEyebrow: "Welcome to dessert heaven",
  heroTitle: "Sweet Share",
  heroSubtitle:
    "Plant-based desserts made gently — no dairy, no eggs, no refined sugar. Baked to be shared, and kind enough for every body at the table.",
  heroVerse: "Taste and see that the Lord is good.",
  heroVerseRef: "Psalm 34:8",
  missionTitle: "Our mission",
  missionBody:
    "We believe a dessert should never be something you pay for later. Sweet Share exists so that the person managing diabetes, the child with an egg allergy, the friend who eats plant-based, and the grandmother who just wants something sweet can all reach for the same plate — and all be glad they did.",
  storyTitle: "Our story",
  orderNote:
    "Every order is baked to order. We ask for a little notice so nothing is rushed and nothing is wasted.",
  pickupAddress: "Pickup details are shared by email once your order is confirmed.",
  contactEmail: "hello@sweetshare.com",
  contactPhone: "",
  instagram: "",
  facebook: "",
  minimumLeadDays: "2",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

export async function getSettings(): Promise<Record<SettingKey, string>> {
  const rows = await prisma.siteSetting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(
    Object.entries(SETTING_DEFAULTS).map(([key, fallback]) => [
      key,
      stored[key] ?? fallback,
    ]),
  ) as Record<SettingKey, string>;
}

export async function setSetting(key: string, value: string) {
  return prisma.siteSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
