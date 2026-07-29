import type { Metadata } from "next";
import Link from "next/link";
import SparkleField from "@/components/SparkleField";
import { prisma } from "@/lib/prisma";
import { findPlan, CLUB_LEAD_TIME_DAYS } from "@/lib/plans";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Welcome to the club",
  robots: { index: false, follow: false },
};

export default async function ClubWelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const subscription = id
    ? await prisma.subscription.findUnique({ where: { id } })
    : null;
  const plan = subscription ? findPlan(subscription.plan) : null;

  return (
    <section className="light-shaft relative overflow-hidden py-28">
      <SparkleField count={32} />
      <div className="shell relative">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-levitate mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose via-candy to-berry text-4xl text-white shadow-[var(--shadow-halo)]">
            ♥
          </div>

          <p className="eyebrow">You are in</p>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4.5rem)]">
            Welcome to the club
          </h1>

          {plan && (
            <p className="placard mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-full px-6 py-3">
              <span
                className="text-xl text-plum"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {plan.name}
              </span>
              <span className="text-xs text-ink-faint">
                {formatMoney(plan.priceCents)} a month
              </span>
            </p>
          )}

          <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-ink-soft">
            Your first box is already booked into the kitchen — we bake it over
            the next {CLUB_LEAD_TIME_DAYS} days and will email you the moment it
            is ready. After that it arrives on the same rhythm every month, and
            we will always tell you before we bake.
          </p>

          {plan && (
            <ul className="mx-auto mt-8 max-w-sm space-y-2.5 rounded-2xl border border-rose/40 bg-white/60 p-6 text-left">
              {plan.contents.map((line) => (
                <li
                  key={line}
                  className="flex gap-2.5 text-sm leading-relaxed text-ink-soft"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-candy" />
                  {line}
                </li>
              ))}
            </ul>
          )}

          <p className="mx-auto mt-8 max-w-lg text-sm leading-relaxed text-ink-faint">
            To pause, change or cancel, simply reply to any of our emails. It
            takes one sentence and we will not try to talk you out of it.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/gallery" className="btn btn-ghost">
              See the gallery
            </Link>
            <Link href="/gatherings" className="btn btn-primary btn-sheen">
              Come to a gathering
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
