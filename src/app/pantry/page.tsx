import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SparkleField from "@/components/SparkleField";
import { prisma } from "@/lib/prisma";
import { media, mediaAlt } from "@/lib/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Pantry — every ingredient, and its glycemic index",
  description:
    "Every ingredient we bake with, explained plainly: what it is, why we chose it, and what it does to blood sugar. Allulose, monk fruit, medjool dates, almond flour, oat flour, flaxseed, cashews and cacao — with glycemic index for each.",
  alternates: { canonical: "/pantry" },
  openGraph: {
    title: "The Pantry · Sweet Share",
    description:
      "Allulose, monk fruit, dates and more — what each ingredient is and what it does to blood sugar.",
    url: "/pantry",
  },
};

const KIND_LABELS: Record<string, string> = {
  sweetener: "Sweeteners",
  flour: "Flours",
  fat: "Fats",
  binder: "Binders",
  fruit: "Fruit",
  nut: "Nuts",
  spice: "Cacao & spice",
};

const NEVER = [
  { name: "Dairy", why: "No milk, butter, cream or whey. Not in anything, ever." },
  { name: "Eggs", why: "Flax and chia do the binding, and they add fibre while they are at it." },
  { name: "Refined sugar", why: "No white sugar, brown sugar, cane syrup or corn syrup." },
  { name: "Artificial sweeteners", why: "No aspartame, sucralose or saccharin. Monk fruit and allulose only." },
  { name: "Hydrogenated oils", why: "No shortening, no margarine, no trans fats." },
  { name: "Artificial colours", why: "If it is pink, a beet or a berry made it pink." },
];

export default async function PantryPage() {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { sortOrder: "asc" },
  });

  const grouped = ingredients.reduce<Record<string, typeof ingredients>>(
    (acc, ingredient) => {
      (acc[ingredient.kind] ??= []).push(ingredient);
      return acc;
    },
    {},
  );

  return (
    <>
      <header className="light-shaft relative overflow-hidden pb-8 pt-20">
        <SparkleField count={18} />
        <div className="shell relative text-center">
          <p className="eyebrow">The archive</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,6rem)]">The Pantry</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Every single thing we bake with, explained in plain words. What it
            is, why it earned its place, and what it actually does to blood
            sugar. No mystery ingredients, no proprietary blends.
          </p>
        </div>
      </header>

      <div className="shell">
        <Reveal className="cloud-fade-b relative aspect-16/9 overflow-hidden rounded-[2rem]">
          <Image
            src={media("pantry")}
            alt={mediaAlt("pantry")}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </Reveal>
      </div>

      {/* ── What never goes in ──────────────────────────────── */}
      <section className="py-20">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">The short list</p>
            <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">
              What never goes in
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-soft">
              It is easier to tell you what we leave out. This list has not
              changed since the day we opened, and it will not.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {NEVER.map((item, index) => (
              <Reveal
                key={item.name}
                delay={index * 80}
                className="card-plinth rounded-2xl p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-berry/10 text-xs text-berry">
                    ✕
                  </span>
                  <div>
                    <h3 className="text-xl leading-tight">{item.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {item.why}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── The glossary ────────────────────────────────────── */}
      <section className="pb-24">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">And what does</p>
            <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">
              The ingredient glossary
            </h2>
          </Reveal>

          <div className="mt-14 space-y-16">
            {Object.entries(grouped).map(([kind, items]) => (
              <div key={kind}>
                <Reveal className="rule-ornament mb-8">
                  <span className="text-[0.65rem] uppercase tracking-[0.28em]">
                    {KIND_LABELS[kind] ?? kind}
                  </span>
                </Reveal>

                <div className="grid gap-6 md:grid-cols-2">
                  {items.map((ingredient, index) => (
                    <Reveal
                      key={ingredient.id}
                      delay={index * 90}
                      className="card-plinth scroll-mt-32 rounded-[1.5rem] p-7"
                    >
                      <div id={ingredient.slug} className="scroll-mt-32">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-2xl leading-tight">
                            {ingredient.name}
                          </h3>
                          {ingredient.glycemicIndex != null && (
                            <div className="shrink-0 text-right">
                              <p className="text-[0.55rem] uppercase tracking-[0.14em] text-ink-faint">
                                Glycemic index
                              </p>
                              <p
                                className={`text-xl leading-none ${
                                  ingredient.glycemicIndex === 0
                                    ? "text-berry"
                                    : ingredient.glycemicIndex < 55
                                      ? "text-plum"
                                      : "text-gold"
                                }`}
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                {ingredient.glycemicIndex}
                              </p>
                            </div>
                          )}
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                          {ingredient.summary}
                        </p>

                        {ingredient.benefits && (
                          <div className="mt-5 rounded-xl bg-cloud/60 px-4 py-3">
                            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-candy">
                              Why it earns its place
                            </p>
                            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                              {ingredient.benefits}
                            </p>
                          </div>
                        )}

                        {ingredient.glycemicIndex != null && (
                          <div className="mt-5">
                            <div className="h-1.5 overflow-hidden rounded-full bg-cloud-2/70">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-rose to-berry"
                                style={{
                                  width: `${Math.max(2, (ingredient.glycemicIndex / 100) * 100)}%`,
                                }}
                              />
                            </div>
                            <div className="mt-1.5 flex justify-between text-[0.58rem] uppercase tracking-[0.1em] text-ink-faint">
                              <span>0 — no effect</span>
                              <span>100 — pure glucose</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Reveal className="mt-20 rounded-[2rem] border border-rose/40 bg-gradient-to-br from-cloud to-white px-8 py-12 text-center sm:px-16">
            <h2 className="text-3xl">Still have a question?</h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
              If something here is unclear, or you need to know about an
              ingredient we have not listed, please ask. We would far rather
              answer a question than have you guess.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/faq" className="btn btn-ghost">
                Questions & facts
              </Link>
              <Link href="/contact" className="btn btn-primary btn-sheen">
                Ask us directly
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
