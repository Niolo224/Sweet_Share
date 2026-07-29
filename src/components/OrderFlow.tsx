"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { formatMoney, earliestDate } from "@/lib/utils";

const DELIVERY_FEE_CENTS = 800;
const FREE_DELIVERY_OVER_CENTS = 6000;

const TIME_WINDOWS = [
  "Morning (9am – 12pm)",
  "Afternoon (12pm – 4pm)",
  "Evening (4pm – 7pm)",
];

export default function OrderFlow({ orderNote }: { orderNote: string }) {
  const router = useRouter();
  const { lines, subtotalCents, setQuantity, remove, leadTimeDays, ready, clear } =
    useCart();

  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [joinList, setJoinList] = useState(true);

  // Gift card
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftCode, setGiftCode] = useState("");
  const [giftChecking, setGiftChecking] = useState(false);
  const [giftError, setGiftError] = useState("");
  const [gift, setGift] = useState<{ code: string; balanceCents: number } | null>(
    null,
  );

  const deliveryFee = useMemo(() => {
    if (fulfillment !== "delivery") return 0;
    return subtotalCents >= FREE_DELIVERY_OVER_CENTS ? 0 : DELIVERY_FEE_CENTS;
  }, [fulfillment, subtotalCents]);

  const gross = subtotalCents + deliveryFee;
  // A card never pays out more than the order is worth; the rest stays on it.
  const giftApplied = gift ? Math.min(gift.balanceCents, gross) : 0;
  const total = gross - giftApplied;
  const minDate = earliestDate(leadTimeDays);

  async function checkGiftCard() {
    if (!giftCode.trim() || giftChecking) return;
    setGiftChecking(true);
    setGiftError("");

    try {
      const response = await fetch("/api/gift-cards/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: giftCode }),
      });
      const data = await response.json();

      if (response.ok) {
        setGift({ code: data.code, balanceCents: data.balanceCents });
        setGiftCode("");
      } else {
        setGiftError(data.error ?? "We could not check that code.");
      }
    } catch {
      setGiftError("We could not check that code just now.");
    } finally {
      setGiftChecking(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending" || lines.length === 0) return;

    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.get("customerName"),
          email: form.get("email"),
          phone: form.get("phone"),
          fulfillment,
          requestedDate: form.get("requestedDate"),
          timeWindow: form.get("timeWindow"),
          address: form.get("address"),
          city: form.get("city"),
          postalCode: form.get("postalCode"),
          occasion: form.get("occasion"),
          notes: form.get("notes"),
          dietaryNotes: form.get("dietaryNotes"),
          giftCardCode: gift?.code ?? null,
          joinList,
          items: lines.map((line) => ({
            dessertId: line.dessertId,
            quantity: line.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        clear();
        router.push(`/order/thank-you?number=${encodeURIComponent(data.orderNumber)}`);
      } else {
        setStatus("error");
        setError(data.error ?? "We could not place that order. Please try again.");
      }
    } catch {
      setStatus("error");
      setError("We could not reach the kitchen. Please try again.");
    }
  }

  if (!ready) {
    return (
      <div className="py-24 text-center text-sm text-ink-faint">
        Opening your basket…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="card-plinth mx-auto max-w-xl rounded-[2rem] p-12 text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-cloud to-cloud-2 text-3xl">
          🕊
        </div>
        <h2 className="text-3xl">Your basket is empty</h2>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-ink-soft">
          Walk the gallery and choose something. Everything is baked to order,
          so there is no rush.
        </p>
        <Link href="/gallery" className="btn btn-primary btn-sheen mt-8">
          Enter the gallery
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start">
      {/* ── Details ─────────────────────────────────────────── */}
      <div className="space-y-8">
        {/* Who */}
        <fieldset className="card-plinth rounded-[1.75rem] p-8">
          <legend className="px-2 text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Who is this for?
          </legend>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="customerName">
                Your name
              </label>
              <input
                id="customerName"
                name="customerName"
                required
                className="field"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="field"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label" htmlFor="phone">
                Phone — optional
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="field"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="label" htmlFor="occasion">
                Occasion — optional
              </label>
              <input
                id="occasion"
                name="occasion"
                className="field"
                placeholder="Birthday, church lunch, just because"
              />
            </div>
          </div>
        </fieldset>

        {/* How */}
        <fieldset className="card-plinth rounded-[1.75rem] p-8">
          <legend className="px-2 text-xl" style={{ fontFamily: "var(--font-display)" }}>
            How would you like it?
          </legend>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(["pickup", "delivery"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFulfillment(option)}
                aria-pressed={fulfillment === option}
                className={`rounded-2xl border p-5 text-left transition-all duration-400 ${
                  fulfillment === option
                    ? "border-rose bg-gradient-to-br from-cloud to-white shadow-[0_10px_30px_-18px_rgba(201,63,108,.8)]"
                    : "border-blush/70 bg-white/50 hover:border-rose"
                }`}
              >
                <p className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
                  {option === "pickup" ? "Collect from us" : "Local delivery"}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-faint">
                  {option === "pickup"
                    ? "Free. We will send the address when we confirm."
                    : `${formatMoney(DELIVERY_FEE_CENTS)}, free over ${formatMoney(FREE_DELIVERY_OVER_CENTS)}.`}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="requestedDate">
                Which day?
              </label>
              <input
                id="requestedDate"
                name="requestedDate"
                type="date"
                required
                min={minDate}
                defaultValue={minDate}
                className="field"
              />
              <p className="mt-1.5 text-[0.68rem] text-ink-faint">
                Earliest is {new Date(`${minDate}T12:00:00`).toLocaleDateString()} —
                your basket needs {leadTimeDays}{" "}
                {leadTimeDays === 1 ? "day" : "days"} of notice.
              </p>
            </div>
            <div>
              <label className="label" htmlFor="timeWindow">
                What time suits?
              </label>
              <select id="timeWindow" name="timeWindow" className="field">
                {TIME_WINDOWS.map((window) => (
                  <option key={window} value={window}>
                    {window}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fulfillment === "delivery" && (
            <div className="mt-5 grid gap-5 sm:grid-cols-[2fr_1fr]">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="address">
                  Delivery address
                </label>
                <input
                  id="address"
                  name="address"
                  required
                  className="field"
                  autoComplete="street-address"
                />
              </div>
              <div>
                <label className="label" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  className="field"
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <label className="label" htmlFor="postalCode">
                  Postal code
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  required
                  className="field"
                  autoComplete="postal-code"
                />
              </div>
            </div>
          )}
        </fieldset>

        {/* Anything else */}
        <fieldset className="card-plinth rounded-[1.75rem] p-8">
          <legend className="px-2 text-xl" style={{ fontFamily: "var(--font-display)" }}>
            Anything we should know?
          </legend>

          <div className="mt-5 space-y-5">
            <div>
              <label className="label" htmlFor="dietaryNotes">
                Allergies and dietary needs
              </label>
              <textarea
                id="dietaryNotes"
                name="dietaryNotes"
                rows={3}
                maxLength={800}
                className="field resize-y"
                placeholder="Everything we bake is already free of dairy, eggs and refined sugar. Tell us about nuts, coconut, gluten, sesame or anything else and we will work with you."
              />
            </div>
            <div>
              <label className="label" htmlFor="notes">
                A message, or how you would like it presented
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                maxLength={800}
                className="field resize-y"
                placeholder="A name to write on the card, a delivery instruction, anything at all."
              />
            </div>

            <label className="flex items-start gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={joinList}
                onChange={(e) => setJoinList(e.target.checked)}
                className="mt-1 accent-[#ee6f94]"
              />
              Send me new menus and gathering invitations.
            </label>
          </div>
        </fieldset>
      </div>

      {/* ── Basket ──────────────────────────────────────────── */}
      <aside className="card-plinth rounded-[1.75rem] p-8 lg:sticky lg:top-28">
        <h2 className="text-2xl">Your basket</h2>

        <ul className="mt-6 space-y-5">
          {lines.map((line) => (
            <li key={line.dessertId} className="flex gap-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-cloud">
                {line.imageUrl && (
                  <Image
                    src={line.imageUrl}
                    alt={line.name}
                    fill
                    sizes="4rem"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight text-plum">
                  {line.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-faint">{line.unitLabel}</p>

                <div className="mt-2.5 flex items-center gap-2">
                  <div className="flex items-center rounded-full border border-blush bg-white/70">
                    <button
                      type="button"
                      aria-label={`Fewer ${line.name}`}
                      onClick={() => setQuantity(line.dessertId, line.quantity - 1)}
                      className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition-colors hover:text-berry"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-xs tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`More ${line.name}`}
                      onClick={() => setQuantity(line.dessertId, line.quantity + 1)}
                      className="grid h-7 w-7 place-items-center rounded-full text-ink-soft transition-colors hover:text-berry"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.dessertId)}
                    className="text-[0.68rem] text-ink-faint underline transition-colors hover:text-berry"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="shrink-0 text-sm tabular-nums text-plum">
                {formatMoney(line.priceCents * line.quantity)}
              </p>
            </li>
          ))}
        </ul>

        {/* Gift card */}
        <div className="mt-6 border-t border-blush/60 pt-5">
          {gift ? (
            <div className="rounded-xl border border-rose/40 bg-cloud/50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-candy">
                    Gift card applied
                  </p>
                  <p className="mt-1 font-mono text-sm text-plum">{gift.code}</p>
                  {gift.balanceCents > giftApplied && (
                    <p className="mt-1 text-[0.68rem] text-ink-faint">
                      {formatMoney(gift.balanceCents - giftApplied)} will stay on
                      the card.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGift(null);
                    setGiftOpen(false);
                  }}
                  className="shrink-0 text-[0.68rem] text-ink-faint underline transition-colors hover:text-berry"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : giftOpen ? (
            <div>
              <label className="label" htmlFor="giftCode">
                Gift card code
              </label>
              <div className="flex gap-2">
                <input
                  id="giftCode"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter here must not submit the whole order.
                    if (e.key === "Enter") {
                      e.preventDefault();
                      checkGiftCard();
                    }
                  }}
                  className="field font-mono uppercase"
                  placeholder="SS-XXXX-XXXX-XXXX"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={checkGiftCard}
                  disabled={giftChecking}
                  className="btn btn-ghost shrink-0 px-5 py-2 text-[0.7rem]"
                >
                  {giftChecking ? "…" : "Apply"}
                </button>
              </div>
              {giftError && (
                <p className="mt-1.5 text-xs text-berry">{giftError}</p>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setGiftOpen(true)}
              className="text-sm text-berry underline transition-colors hover:text-plum"
            >
              Have a gift card?
            </button>
          )}
        </div>

        <dl className="mt-6 space-y-2.5 border-t border-blush/60 pt-6 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="tabular-nums text-plum">{formatMoney(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              {fulfillment === "delivery" ? "Delivery" : "Collection"}
            </dt>
            <dd className="tabular-nums text-plum">
              {deliveryFee === 0 ? "Free" : formatMoney(deliveryFee)}
            </dd>
          </div>
          {giftApplied > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Gift card</dt>
              <dd className="tabular-nums text-berry">
                −{formatMoney(giftApplied)}
              </dd>
            </div>
          )}
          <div className="flex justify-between border-t border-blush/60 pt-3">
            <dt className="text-base text-plum">Total</dt>
            <dd
              className="text-2xl tabular-nums text-berry"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatMoney(total)}
            </dd>
          </div>
        </dl>

        {error && (
          <p className="mt-5 rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-sheen mt-7 w-full"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Place my advance order"}
        </button>

        <p className="mt-4 text-[0.68rem] leading-relaxed text-ink-faint">
          {orderNote}{" "}
          {total === 0
            ? "Your gift card covers this in full, so there is nothing to pay."
            : "No payment is taken here — we will confirm everything by email first, then send a secure payment link."}
        </p>
      </aside>
    </form>
  );
}
