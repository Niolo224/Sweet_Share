/** Join class names, dropping anything falsy. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatDate(date: Date | string, style: "long" | "short" = "long") {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: style,
    timeZone: "UTC",
  }).format(d);
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Our JSON-in-a-string columns are always arrays; never throw on bad data. */
export function parseList<T = string>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export type IngredientLine = { name: string; note?: string };

/** Net carbs is what matters most to a guest counting sugar. */
export function netCarbs(
  totalCarbsG?: number | null,
  fiberG?: number | null,
  sugarAlcoholG?: number | null,
) {
  if (totalCarbsG == null) return null;
  const net = totalCarbsG - (fiberG ?? 0) - (sugarAlcoholG ?? 0);
  return Math.max(0, Math.round(net * 10) / 10);
}

/** A plain-English read on how gently a dessert lands on blood sugar. */
export function glycemicVerdict(load?: number | null) {
  if (load == null) return null;
  if (load <= 10) return { label: "Gentle", tone: "low" as const };
  if (load <= 19) return { label: "Moderate", tone: "mid" as const };
  return { label: "Rich — share it", tone: "high" as const };
}

export function orderNumber() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `SS-${stamp}${rand}`;
}

/** The earliest date a guest may choose, given our longest lead time. */
export function earliestDate(leadTimeDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + leadTimeDays);
  return d.toISOString().slice(0, 10);
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}
