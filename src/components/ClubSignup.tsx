"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/utils";
import {
  type Plan,
  type BillingInterval,
  priceFor,
  annualCents,
  annualSavingCents,
} from "@/lib/plans";

export default function ClubSignup({
  plans,
  initialPlan,
  initialInterval = "month",
}: {
  plans: Plan[];
  initialPlan?: string;
  initialInterval?: BillingInterval;
}) {
  const [planKey, setPlanKey] = useState(
    initialPlan ?? plans.find((p) => p.featured)?.key ?? plans[0]?.key ?? "",
  );
  const [interval, setInterval] = useState<BillingInterval>(initialInterval);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [joinList, setJoinList] = useState(true);
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  const plan = plans.find((p) => p.key === planKey);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending" || !plan) return;

    const form = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planKey,
          interval,
          customerName: form.get("customerName"),
          email: form.get("email"),
          phone: form.get("phone"),
          fulfillment,
          address: form.get("address"),
          city: form.get("city"),
          postalCode: form.get("postalCode"),
          dietaryNotes: form.get("dietaryNotes"),
          joinList,
        }),
      });
      const data = await response.json();

      if (response.ok && data.url) {
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
      {/* Monthly or yearly */}
      <fieldset>
        <legend className="label">How would you like to pay?</legend>
        <div className="mt-1 inline-flex w-full rounded-full border border-blush bg-white/60 p-1">
          {(
            [
              { value: "month" as const, label: "Monthly" },
              { value: "year" as const, label: "Yearly" },
            ]
          ).map((option) => {
            const active = interval === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setInterval(option.value)}
                aria-pressed={active}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-400 ${
                  active
                    ? "bg-gradient-to-r from-rose to-berry text-white shadow-[0_8px_20px_-10px_rgba(201,63,108,.9)]"
                    : "text-ink-soft hover:text-berry"
                }`}
              >
                {option.label}
                {option.value === "year" && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] ${
                      active ? "bg-white/25 text-white" : "bg-cloud text-berry"
                    }`}
                  >
                    1 month free
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-7">
        <legend className="label">Which box?</legend>
        <div className="mt-2 space-y-3">
          {plans.map((option) => {
            const active = planKey === option.key;
            const charge = priceFor(option, interval);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setPlanKey(option.key)}
                aria-pressed={active}
                className={`block w-full rounded-2xl border p-5 text-left transition-all duration-400 ${
                  active
                    ? "border-rose bg-gradient-to-br from-cloud to-white shadow-[0_10px_30px_-18px_rgba(201,63,108,.8)]"
                    : "border-blush/70 bg-white/50 hover:border-rose"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span
                    className="text-xl text-plum"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {option.name}
                  </span>
                  <span className="text-lg text-berry">
                    {formatMoney(charge)}
                    <span className="ml-1 text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
                      / {interval === "year" ? "year" : "month"}
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{option.tagline}</p>
                {interval === "year" && (
                  <p className="mt-1.5 text-xs text-ink-faint">
                    Twelve boxes for the price of eleven — saving{" "}
                    {formatMoney(annualSavingCents(option))}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="club-name">
            Your name
          </label>
          <input
            id="club-name"
            name="customerName"
            required
            className="field"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor="club-email">
            Email
          </label>
          <input
            id="club-email"
            name="email"
            type="email"
            required
            className="field"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="label" htmlFor="club-phone">
          Phone — optional
        </label>
        <input
          id="club-phone"
          name="phone"
          type="tel"
          className="field"
          autoComplete="tel"
        />
      </div>

      <fieldset className="mt-7">
        <legend className="label">Each month, would you like to…</legend>
        <div className="mt-1 grid gap-3 sm:grid-cols-2">
          {(["pickup", "delivery"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFulfillment(option)}
              aria-pressed={fulfillment === option}
              className={`rounded-2xl border p-4 text-left transition-all duration-400 ${
                fulfillment === option
                  ? "border-rose bg-gradient-to-br from-cloud to-white"
                  : "border-blush/70 bg-white/50 hover:border-rose"
              }`}
            >
              <p className="text-base" style={{ fontFamily: "var(--font-display)" }}>
                {option === "pickup" ? "Collect it" : "Have it delivered"}
              </p>
              <p className="mt-1 text-xs text-ink-faint">
                {option === "pickup"
                  ? "We email you when it is ready."
                  : "Local delivery, included in the price."}
              </p>
            </button>
          ))}
        </div>
      </fieldset>

      {fulfillment === "delivery" && (
        <div className="mt-5 grid gap-5 sm:grid-cols-[2fr_1fr]">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="club-address">
              Delivery address
            </label>
            <input
              id="club-address"
              name="address"
              required
              className="field"
              autoComplete="street-address"
            />
          </div>
          <div>
            <label className="label" htmlFor="club-city">
              City
            </label>
            <input
              id="club-city"
              name="city"
              required
              className="field"
              autoComplete="address-level2"
            />
          </div>
          <div>
            <label className="label" htmlFor="club-postal">
              Postal code
            </label>
            <input
              id="club-postal"
              name="postalCode"
              required
              className="field"
              autoComplete="postal-code"
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        <label className="label" htmlFor="club-dietary">
          Allergies and dietary needs
        </label>
        <textarea
          id="club-dietary"
          name="dietaryNotes"
          rows={3}
          maxLength={800}
          className="field resize-y"
          placeholder="Everything is already free of dairy, eggs and refined sugar. Tell us about nuts, coconut, gluten or anything else and we will work around it every month."
        />
      </div>

      <label className="mt-5 flex items-start gap-2.5 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={joinList}
          onChange={(e) => setJoinList(e.target.checked)}
          className="mt-1 accent-[#ee6f94]"
        />
        Send me new menus and gathering invitations too.
      </label>

      {status === "error" && (
        <p className="mt-5 rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-sheen mt-7 w-full"
        disabled={status === "sending" || !plan}
      >
        {status === "sending"
          ? "Taking you to checkout…"
          : plan
            ? `Join — ${formatMoney(priceFor(plan, interval))} ${
                interval === "year" ? "for the year" : "a month"
              }`
            : "Choose a box"}
      </button>

      <p className="mt-4 text-center text-[0.68rem] leading-relaxed text-ink-faint">
        {interval === "year" ? (
          <>
            Paid once through Stripe, then a box every month for twelve months.
            Renews yearly, and you can stop it any time — just write to us.
          </>
        ) : (
          <>
            Billed monthly through Stripe. Pause or cancel whenever you like —
            just write to us and it is done, no forms and no persuading.
          </>
        )}
      </p>
      {interval === "year" && plan && (
        <p className="mt-2 text-center text-[0.68rem] text-ink-faint">
          That is {formatMoney(Math.round(annualCents(plan) / 12))} a month,
          effectively.
        </p>
      )}
    </form>
  );
}
