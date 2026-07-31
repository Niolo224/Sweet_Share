import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SparkleField from "@/components/SparkleField";
import RewardsLookup from "@/components/RewardsLookup";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/seo";
import { media, mediaAlt } from "@/lib/media";
import { formatMoney } from "@/lib/utils";
import {
  TIERS,
  REWARD_THRESHOLD,
  REWARD_VALUE_CENTS,
  POINTS_PER_DOLLAR,
  POINTS_PER_REVIEW,
  CLUB_MULTIPLIER,
} from "@/lib/loyalty";

export const metadata: Metadata = {
  title: "The Table — our loyalty programme",
  description: `Earn ${POINTS_PER_DOLLAR} point per dollar at Sweet Share. ${REWARD_THRESHOLD} points becomes ${formatMoney(REWARD_VALUE_CENTS)} to spend. No signup, no card, no app — points follow your email address automatically.`,
  alternates: { canonical: "/rewards" },
  openGraph: {
    title: "The Table · Sweet Share",
    description: `${REWARD_THRESHOLD} points becomes ${formatMoney(REWARD_VALUE_CENTS)}. No signup, no card, no app.`,
    url: "/rewards",
  },
};

const HOW = [
  {
    step: "Order as normal",
    body: `Every dollar you spend earns ${POINTS_PER_DOLLAR} point. There is nothing to join and no card to carry — points follow the email address you already give us at checkout.`,
  },
  {
    step: "Say what you thought",
    body: `A published review earns ${POINTS_PER_REVIEW} points. Four stars earns exactly what five stars earns; we would rather have the truth.`,
  },
  {
    step: "We send the reward to you",
    body: `At ${REWARD_THRESHOLD} points we email you ${formatMoney(REWARD_VALUE_CENTS)} to spend, without being asked. No expiry, no claiming, no forgetting.`,
  },
];

const FAQ = [
  {
    q: "Do I need to sign up?",
    a: "No. There is no account, no password and no app. Points attach to the email address you use at checkout, and they start counting from your first order.",
  },
  {
    q: "How much is a point worth?",
    a: `${REWARD_THRESHOLD} points becomes ${formatMoney(REWARD_VALUE_CENTS)} to spend, so a point is worth about five cents. You earn ${POINTS_PER_DOLLAR} point per dollar spent, which works out at roughly five percent back.`,
  },
  {
    q: "Do my points expire?",
    a: "No. Neither do the rewards they turn into — our gift cards never expire, and any unspent balance stays on the card.",
  },
  {
    q: "Do club members earn faster?",
    a: `Yes — ${CLUB_MULTIPLIER}× on every box. Club members are the reason we can plan our baking, so it seemed only fair.`,
  },
  {
    q: "What happens if I cancel an order?",
    a: "The points come back off, the same way the money does. A reward we have already sent you is yours to keep, though.",
  },
  {
    q: "Can I give my reward to someone else?",
    a: "Of course. A reward arrives as an ordinary gift card code, so you can pass it to whoever you like.",
  },
];

export default function RewardsPage() {
  return (
    <>
      <JsonLd
        data={[
          faqSchema(FAQ),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "The Table", path: "/rewards" },
          ]),
        ]}
      />

      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={22} />
        <div className="shell relative text-center">
          <p className="eyebrow">For people who keep coming back</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,6rem)]">The Table</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            No card, no app, nothing to sign up for. Order as you already do and
            we keep count — then {formatMoney(REWARD_VALUE_CENTS)} arrives in
            your inbox without you having to ask.
          </p>
        </div>
      </header>

      {/* How it works */}
      <section className="py-14">
        <div className="shell">
          <div className="grid gap-6 md:grid-cols-3">
            {HOW.map((item, index) => (
              <Reveal
                key={item.step}
                delay={index * 100}
                className="card-plinth rounded-[1.75rem] p-7"
              >
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-candy">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-2xl leading-tight">{item.step}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-12">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The longer you stay</p>
            <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">
              Three places at the table
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-soft">
              You move up on what you have earned over time, and you never move
              back down. Nobody loses their seat for being away a while.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TIERS.map((tier, index) => (
              <Reveal
                key={tier.key}
                delay={index * 100}
                className={`rounded-[1.75rem] border p-7 ${
                  index === TIERS.length - 1
                    ? "border-rose/60 bg-gradient-to-br from-cloud to-white"
                    : "border-blush/60 bg-white/50"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className="text-2xl text-plum"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {tier.name}
                  </h3>
                  <span className="text-xs text-ink-faint">
                    {tier.from === 0 ? "from the start" : `${tier.from}+ points`}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {tier.blurb}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Check balance */}
      <section className="py-14">
        <div className="shell">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <div className="halo relative aspect-4/5 overflow-hidden rounded-[2rem] shadow-[var(--shadow-lifted)]">
                <Image
                  src={media("giftBox")}
                  alt={mediaAlt("giftBox")}
                  fill
                  sizes="(min-width: 1024px) 34rem, 92vw"
                  className="object-cover"
                />
              </div>
            </Reveal>

            <Reveal delay={140}>
              <p className="eyebrow">Where do I stand?</p>
              <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">
                Check your points
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-soft">
                Enter the email you order with and we will send your balance,
                your place at the table, and how close the next reward is.
              </p>
              <div className="mt-8">
                <RewardsLookup />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="pb-24 pt-6">
        <div className="shell mx-auto max-w-3xl">
          <Reveal className="rule-ornament mb-10">
            <span className="text-[0.65rem] uppercase tracking-[0.28em]">
              Questions
            </span>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {FAQ.map((item, index) => (
              <Reveal
                key={item.q}
                delay={index * 70}
                className="rounded-2xl border border-blush/60 bg-white/50 p-6"
              >
                <h3
                  className="text-lg leading-snug text-plum"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.q}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {item.a}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-14 rounded-[2rem] border border-rose/40 bg-gradient-to-br from-cloud to-white px-8 py-12 text-center sm:px-16">
            <h2 className="text-3xl">Start earning with your next order</h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink-soft">
              There is genuinely nothing to do first. Order, and we will count.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/gallery" className="btn btn-primary btn-sheen">
                See the gallery
              </Link>
              <Link href="/club" className="btn btn-ghost">
                Join the club — {CLUB_MULTIPLIER}× points
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
