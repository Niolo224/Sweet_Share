"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/utils";
import { GIFT_AMOUNTS, MIN_GIFT_CENTS, MAX_GIFT_CENTS } from "@/lib/giftcards";

export default function GiftCardPurchase() {
  const [amountCents, setAmountCents] = useState<number>(5000);
  const [custom, setCustom] = useState("");
  const [sendToRecipient, setSendToRecipient] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  const usingCustom = custom.trim().length > 0;
  const customCents = Math.round(Number(custom) * 100);
  const effectiveCents = usingCustom ? customCents : amountCents;
  const validAmount =
    Number.isFinite(effectiveCents) &&
    effectiveCents >= MIN_GIFT_CENTS &&
    effectiveCents <= MAX_GIFT_CENTS;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending" || !validAmount) return;

    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: effectiveCents,
          purchaserName: form.get("purchaserName"),
          purchaserEmail: form.get("purchaserEmail"),
          recipientName: sendToRecipient ? form.get("recipientName") : null,
          recipientEmail: sendToRecipient ? form.get("recipientEmail") : null,
          message: form.get("message"),
        }),
      });
      const data = await response.json();

      if (response.ok && data.url) {
        // Straight to Stripe — there is nothing to bake, so nothing to confirm.
        window.location.href = data.url;
      } else {
        setStatus("error");
        setError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setError("We could not reach the kitchen. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="card-plinth rounded-[1.75rem] p-8 sm:p-10">
      <fieldset>
        <legend className="label">How much?</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {GIFT_AMOUNTS.map((cents) => {
            const active = !usingCustom && amountCents === cents;
            return (
              <button
                key={cents}
                type="button"
                onClick={() => {
                  setAmountCents(cents);
                  setCustom("");
                }}
                aria-pressed={active}
                className={`rounded-full border px-5 py-2.5 text-sm transition-all duration-300 ${
                  active
                    ? "border-transparent bg-gradient-to-r from-rose to-berry text-white shadow-[0_8px_20px_-10px_rgba(201,63,108,.9)]"
                    : "border-blush bg-white/60 text-ink-soft hover:border-rose hover:text-berry"
                }`}
              >
                {formatMoney(cents)}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <label className="sr-only" htmlFor="gift-custom">
            A different amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint">
              $
            </span>
            <input
              id="gift-custom"
              type="number"
              min={MIN_GIFT_CENTS / 100}
              max={MAX_GIFT_CENTS / 100}
              step="1"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="field pl-8"
              placeholder="Or a different amount"
            />
          </div>
          {usingCustom && !validAmount && (
            <p className="mt-1.5 text-xs text-berry">
              Please choose between {formatMoney(MIN_GIFT_CENTS)} and{" "}
              {formatMoney(MAX_GIFT_CENTS)}.
            </p>
          )}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="purchaserName">
            Your name
          </label>
          <input
            id="purchaserName"
            name="purchaserName"
            required
            className="field"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="purchaserEmail">
            Your email
          </label>
          <input
            id="purchaserEmail"
            name="purchaserEmail"
            type="email"
            required
            className="field"
            autoComplete="email"
          />
        </div>
      </div>

      <label className="mt-6 flex items-start gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={sendToRecipient}
          onChange={(e) => setSendToRecipient(e.target.checked)}
          className="mt-1 accent-[#ee6f94]"
        />
        Email it straight to them — otherwise we send the code to you to pass on
        yourself.
      </label>

      {sendToRecipient && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="recipientName">
              Their name
            </label>
            <input id="recipientName" name="recipientName" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="recipientEmail">
              Their email
            </label>
            <input
              id="recipientEmail"
              name="recipientEmail"
              type="email"
              required={sendToRecipient}
              className="field"
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        <label className="label" htmlFor="message">
          A note — optional
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={500}
          className="field resize-y"
          placeholder="Thinking of you. Eat something lovely."
        />
      </div>

      {status === "error" && (
        <p className="mt-5 rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-sheen mt-7 w-full"
        disabled={status === "sending" || !validAmount}
      >
        {status === "sending"
          ? "Taking you to checkout…"
          : `Send ${validAmount ? formatMoney(effectiveCents) : "a gift"}`}
      </button>

      <p className="mt-4 text-center text-[0.68rem] leading-relaxed text-ink-faint">
        Paid securely through Stripe — we never see your card details. Cards
        never expire, and any unspent balance stays on the card.
      </p>
    </form>
  );
}
