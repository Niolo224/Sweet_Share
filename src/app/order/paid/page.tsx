import type { Metadata } from "next";
import Link from "next/link";
import SparkleField from "@/components/SparkleField";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment received",
  robots: { index: false, follow: false },
};

export default async function PaidPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string }>;
}) {
  const { number } = await searchParams;

  // Stripe redirects here immediately; the webhook may land a moment later,
  // so the page never promises more than the database actually knows.
  const order = number
    ? await prisma.order.findUnique({ where: { orderNumber: number } })
    : null;

  const settled = order?.paymentStatus === "paid";
  const clearing = order?.paymentStatus === "processing";

  return (
    <section className="light-shaft relative overflow-hidden py-28">
      <SparkleField count={32} />
      <div className="shell relative">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-levitate mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose via-candy to-berry text-4xl text-white shadow-[var(--shadow-halo)]">
            ✓
          </div>

          <p className="eyebrow">
            {clearing ? "On its way" : "Payment received"}
          </p>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4.5rem)]">Thank you</h1>

          {order && (
            <p className="placard mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full px-6 py-3">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-candy">
                Order
              </span>
              <span
                className="text-xl text-plum"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {order.orderNumber}
              </span>
              <span className="text-xs text-ink-faint">
                {formatMoney(order.totalCents)}
              </span>
            </p>
          )}

          <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-ink-soft">
            {clearing ? (
              <>
                Your bank transfer is on its way. Those take a few working days
                to settle — we will email you the moment it lands, and your date
                is held in the meantime.
              </>
            ) : settled && order ? (
              <>
                Everything is settled and your order is confirmed for{" "}
                <strong className="text-plum">
                  {formatDate(order.requestedDate)}
                </strong>
                {order.timeWindow ? `, ${order.timeWindow}` : ""}. We bake on
                the morning of your date, never before.
              </>
            ) : (
              <>
                Your payment has gone through. Confirmation is landing in your
                inbox now — if it has not arrived in a few minutes, check your
                spam folder and then tell us.
              </>
            )}
          </p>

          <div className="mt-8 rounded-2xl border border-rose/40 bg-white/60 p-6">
            <p className="verse">
              “Whoever is generous to the poor lends to the Lord, and he will
              repay him for his deed.”
            </p>
            <p className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-candy">
              Proverbs 19:17
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/gallery" className="btn btn-ghost">
              Back to the gallery
            </Link>
            <Link href="/testimonials" className="btn btn-primary btn-sheen">
              Tell us how it goes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
