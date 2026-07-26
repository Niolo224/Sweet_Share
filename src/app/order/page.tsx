import type { Metadata } from "next";
import OrderFlow from "@/components/OrderFlow";
import SparkleField from "@/components/SparkleField";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Ahead",
  description:
    "Place an advance order with Sweet Share. Everything is baked to order — choose your day, tell us about allergies, and collect or have it delivered.",
  robots: { index: false, follow: true },
};

const STEPS = [
  { n: "01", title: "You order", body: "Choose your day and tell us about any allergies." },
  { n: "02", title: "We confirm", body: "A real person replies, usually the same day." },
  { n: "03", title: "We bake", body: "Fresh on the morning of your date, never before." },
  { n: "04", title: "You share it", body: "Collect from us, or we bring it to your door." },
];

export default async function OrderPage() {
  const settings = await getSettings();

  return (
    <>
      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={16} />
        <div className="shell relative text-center">
          <p className="eyebrow">Baked to order</p>
          <h1 className="mt-4 text-[clamp(2.6rem,7vw,5rem)]">Order ahead</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            {settings.orderNote}
          </p>
        </div>
      </header>

      <section className="pb-10 pt-6">
        <div className="shell">
          <ol className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-4">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="rounded-2xl border border-blush/60 bg-white/50 p-5 text-center"
              >
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-candy">
                  {step.n}
                </p>
                <p
                  className="mt-2 text-lg leading-tight text-plum"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-faint">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-24 pt-8">
        <div className="shell">
          <OrderFlow orderNote={settings.pickupAddress} />
        </div>
      </section>
    </>
  );
}
