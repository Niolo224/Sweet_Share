import type { Metadata } from "next";
import Image from "next/image";
import ClubSignup from "@/components/ClubSignup";
import Reveal from "@/components/Reveal";
import SparkleField from "@/components/SparkleField";
import { PLANS } from "@/lib/plans";
import { media, mediaAlt } from "@/lib/media";
import { formatMoney } from "@/lib/utils";

export const metadata: Metadata = {
  title: "The Sweet Share Club",
  description:
    "A box of plant-based, diabetes-friendly desserts every month. No dairy, no eggs, no refined sugar. Pause or cancel any time.",
};

export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; cancelled?: string }>;
}) {
  const { plan, cancelled } = await searchParams;

  return (
    <>
      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={22} />
        <div className="shell relative text-center">
          <p className="eyebrow">A standing order</p>
          <h1 className="mt-4 text-[clamp(2.6rem,7.5vw,5.5rem)]">
            The Sweet Share Club
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            A box every month, baked fresh and brought to you. For people who
            have worked out that having something good in the house on a
            Thursday is not a luxury — it is how you get through Thursday.
          </p>
        </div>
      </header>

      {/* ── The boxes ───────────────────────────────────────── */}
      <section className="py-14">
        <div className="shell">
          <div className="grid gap-7 lg:grid-cols-3">
            {PLANS.map((option, index) => {
              const saving = option.compareAtCents - option.priceCents;
              return (
                <Reveal
                  key={option.key}
                  delay={index * 110}
                  className={`card-plinth relative flex flex-col overflow-hidden rounded-[1.75rem] ${
                    option.featured ? "ring-2 ring-rose/50" : ""
                  }`}
                >
                  {option.featured && (
                    <span className="absolute right-5 top-5 z-10 rounded-full bg-gradient-to-r from-rose to-berry px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white">
                      Most joined
                    </span>
                  )}

                  <div className="relative aspect-16/10 overflow-hidden">
                    <Image
                      src={media(option.imageKey)}
                      alt={mediaAlt(option.imageKey)}
                      fill
                      sizes="(min-width: 1024px) 30vw, 92vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-7">
                    <h2 className="text-2xl leading-tight">{option.name}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {option.tagline}
                    </p>

                    <p className="mt-5 flex items-baseline gap-2">
                      <span
                        className="text-4xl text-berry"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {formatMoney(option.priceCents)}
                      </span>
                      <span className="text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint">
                        / month
                      </span>
                    </p>

                    {saving > 0 && (
                      <p className="mt-1 text-xs text-ink-faint">
                        {formatMoney(saving)} less than buying it box by box
                      </p>
                    )}

                    <ul className="mt-6 flex-1 space-y-2.5 border-t border-blush/60 pt-5">
                      {option.contents.map((line) => (
                        <li
                          key={line}
                          className="flex gap-2.5 text-sm leading-relaxed text-ink-soft"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-candy" />
                          {line}
                        </li>
                      ))}
                    </ul>

                    <a
                      href={`#join`}
                      className={`mt-7 ${option.featured ? "btn btn-primary btn-sheen" : "btn btn-ghost"}`}
                    >
                      Choose this box
                    </a>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why ─────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="shell">
          <Reveal className="mx-auto max-w-3xl rounded-[2rem] border border-rose/40 bg-gradient-to-br from-cloud to-white p-8 sm:p-12">
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  title: "Nothing sits",
                  body: "Your box is baked in the days before it reaches you, never pulled from a shelf.",
                },
                {
                  title: "We remember",
                  body: "Tell us your allergies once. We work around them every single month without being asked again.",
                },
                {
                  title: "Leave easily",
                  body: "Pause or cancel by replying to any email. No forms, no retention offers, no being talked out of it.",
                },
              ].map((item) => (
                <div key={item.title}>
                  <h3
                    className="text-xl text-plum"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Join ────────────────────────────────────────────── */}
      <section id="join" className="scroll-mt-28 py-14 pb-24">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <p className="eyebrow">Pull up a chair</p>
              <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">Join the club</h2>
            </div>

            {cancelled && (
              <p className="mb-6 rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-plum">
                No payment was taken and nothing was started — come back
                whenever you are ready.
              </p>
            )}

            <ClubSignup plans={PLANS} initialPlan={plan} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
