import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToBasket from "@/components/AddToBasket";
import Reveal from "@/components/Reveal";
import SparkleField from "@/components/SparkleField";
import TestimonialCard from "@/components/TestimonialCard";
import { prisma } from "@/lib/prisma";
import {
  formatMoney,
  parseList,
  netCarbs,
  glycemicVerdict,
  type IngredientLine,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const dessert = await prisma.dessert.findUnique({ where: { slug } });
  if (!dessert) return { title: "Not found" };

  return {
    title: dessert.name,
    description: dessert.tagline,
    openGraph: {
      title: `${dessert.name} · Sweet Share`,
      description: dessert.description,
      images: dessert.imageUrl ? [{ url: dessert.imageUrl }] : undefined,
    },
  };
}

export default async function DessertPage({ params }: Params) {
  const { slug } = await params;

  const dessert = await prisma.dessert.findUnique({
    where: { slug },
    include: {
      reviews: {
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        take: 4,
      },
    },
  });

  if (!dessert) notFound();

  const [related, allIngredients] = await Promise.all([
    prisma.dessert.findMany({
      where: { slug: { not: slug }, isAvailable: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    prisma.ingredient.findMany(),
  ]);

  const ingredients = parseList<IngredientLine>(dessert.ingredients);
  const allergens = parseList(dessert.allergens);
  const badges = parseList(dessert.badges);
  const net = netCarbs(
    dessert.totalCarbsG,
    dessert.fiberG,
    dessert.sugarAlcoholG,
  );
  const verdict = glycemicVerdict(dessert.glycemicLoad);

  const ratingCount = dessert.reviews.length;
  const ratingAvg =
    ratingCount > 0
      ? dessert.reviews.reduce((sum, r) => sum + r.rating, 0) / ratingCount
      : null;

  /** Link an ingredient to its pantry entry when we have one. */
  const pantryLink = (name: string) => {
    const match = allIngredients.find((i) =>
      name.toLowerCase().includes(i.name.toLowerCase().split(" ")[0]),
    );
    return match ? `/pantry#${match.slug}` : null;
  };

  const nutritionRows = [
    { label: "Calories", value: dessert.calories, unit: "" },
    { label: "Total carbohydrate", value: dessert.totalCarbsG, unit: "g" },
    { label: "Dietary fibre", value: dessert.fiberG, unit: "g", indent: true },
    { label: "Total sugars", value: dessert.sugarsG, unit: "g", indent: true },
    {
      label: "Added sugars",
      value: dessert.addedSugarsG,
      unit: "g",
      indent: true,
      highlight: dessert.addedSugarsG === 0,
    },
    {
      label: "Sugar alcohols",
      value: dessert.sugarAlcoholG,
      unit: "g",
      indent: true,
    },
    { label: "Protein", value: dessert.proteinG, unit: "g" },
    { label: "Total fat", value: dessert.fatG, unit: "g" },
    { label: "Saturated fat", value: dessert.satFatG, unit: "g", indent: true },
    { label: "Sodium", value: dessert.sodiumMg, unit: "mg" },
  ].filter((row) => row.value != null);

  return (
    <>
      <nav className="shell pt-10 text-xs text-ink-faint">
        <Link href="/gallery" className="transition-colors hover:text-berry">
          The Gallery
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{dessert.name}</span>
      </nav>

      {/* ── The exhibit ─────────────────────────────────────── */}
      <section className="relative overflow-hidden py-12">
        <SparkleField count={18} />
        <div className="shell relative grid gap-14 lg:grid-cols-2 lg:items-start">
          <Reveal className="lg:sticky lg:top-28">
            <div className="halo relative aspect-4/5 overflow-hidden rounded-[2rem] shadow-[var(--shadow-lifted)]">
              {dessert.imageUrl && (
                <Image
                  src={dessert.imageUrl}
                  alt={dessert.imageAlt ?? dessert.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40rem, 92vw"
                  className="object-cover"
                />
              )}
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <span key={badge} className="badge">
                  {badge}
                </span>
              ))}
            </div>

            <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.98]">
              {dessert.name}
            </h1>
            <p className="mt-3 text-lg italic text-candy">{dessert.tagline}</p>

            {ratingAvg != null && (
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                <span className="text-gold">
                  {"★".repeat(Math.round(ratingAvg))}
                  <span className="text-cloud-2">
                    {"★".repeat(5 - Math.round(ratingAvg))}
                  </span>
                </span>
                {ratingAvg.toFixed(1)} from {ratingCount}{" "}
                {ratingCount === 1 ? "guest" : "guests"}
              </p>
            )}

            <p className="mt-7 text-base leading-relaxed text-ink-soft">
              {dessert.description}
            </p>

            <div className="mt-9 flex flex-wrap items-end gap-x-6 gap-y-2">
              <p
                className="text-4xl text-berry"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {formatMoney(dessert.priceCents)}
              </p>
              <p className="text-sm text-ink-faint">
                {dessert.unitLabel}
                {dessert.servesText ? ` · ${dessert.servesText}` : ""}
              </p>
            </div>

            <div className="mt-7">
              {dessert.isAvailable ? (
                <AddToBasket
                  withQuantity
                  line={{
                    dessertId: dessert.id,
                    slug: dessert.slug,
                    name: dessert.name,
                    priceCents: dessert.priceCents,
                    imageUrl: dessert.imageUrl,
                    unitLabel: dessert.unitLabel,
                    leadTimeDays: dessert.leadTimeDays,
                  }}
                  className="btn btn-primary btn-sheen flex-1"
                />
              ) : (
                <p className="rounded-2xl border border-blush bg-cloud/60 px-5 py-4 text-sm text-ink-soft">
                  This one is resting for the season. Join the list and we will
                  tell you the day it returns.
                </p>
              )}
            </div>

            <p className="mt-4 text-xs text-ink-faint">
              Baked to order — please allow {dessert.leadTimeDays}{" "}
              {dessert.leadTimeDays === 1 ? "day" : "days"} notice.
            </p>

            {/* Glycemic placard */}
            {verdict && (
              <div className="placard mt-9 rounded-2xl p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-candy">
                    How it lands on blood sugar
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
                      verdict.tone === "low"
                        ? "bg-white/80 text-plum"
                        : verdict.tone === "mid"
                          ? "bg-gold/25 text-plum"
                          : "bg-berry/15 text-berry"
                    }`}
                  >
                    {verdict.label}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4 text-center">
                  <Stat label="Net carbs" value={net != null ? `${net} g` : "—"} />
                  <Stat
                    label="Added sugar"
                    value={`${dessert.addedSugarsG ?? 0} g`}
                  />
                  <Stat
                    label="Glycemic load"
                    value={dessert.glycemicLoad?.toString() ?? "—"}
                  />
                </div>

                {dessert.glycemicNote && (
                  <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                    {dessert.glycemicNote}
                  </p>
                )}
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── The placard: ingredients, nutrition, story ──────── */}
      <section className="py-16">
        <div className="shell grid gap-8 lg:grid-cols-3">
          <Reveal className="card-plinth rounded-[1.75rem] p-8">
            <h2 className="text-2xl">Every ingredient</h2>
            <p className="mt-2 text-xs text-ink-faint">
              Named plainly, in order of quantity. Nothing else goes in.
            </p>
            <ul className="mt-6 space-y-3">
              {ingredients.map((line) => {
                const href = pantryLink(line.name);
                return (
                  <li
                    key={line.name}
                    className="border-b border-blush/50 pb-3 last:border-0"
                  >
                    {href ? (
                      <Link
                        href={href}
                        className="text-sm font-medium text-plum underline decoration-rose/50 underline-offset-4 transition-colors hover:text-berry"
                      >
                        {line.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-plum">
                        {line.name}
                      </span>
                    )}
                    {line.note && (
                      <span className="mt-0.5 block text-xs italic text-ink-faint">
                        {line.note}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {allergens.length > 0 && (
              <div className="mt-7 rounded-xl bg-cloud/70 p-4">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-berry">
                  Contains
                </p>
                <p className="mt-1.5 text-sm text-ink-soft">
                  {allergens.join(", ")}
                </p>
                <p className="mt-2 text-[0.68rem] leading-relaxed text-ink-faint">
                  Baked in a kitchen that also handles tree nuts, coconut, soy,
                  sesame and gluten.
                </p>
              </div>
            )}
          </Reveal>

          <Reveal delay={110} className="card-plinth rounded-[1.75rem] p-8">
            <h2 className="text-2xl">Nutrition</h2>
            <p className="mt-2 text-xs text-ink-faint">
              Per {dessert.servingSize ?? "serving"}
            </p>

            <dl className="mt-6">
              {nutritionRows.map((row) => (
                <div
                  key={row.label}
                  className={`flex items-baseline justify-between border-b border-blush/50 py-2.5 last:border-0 ${
                    row.indent ? "pl-4" : ""
                  }`}
                >
                  <dt
                    className={`text-sm ${
                      row.highlight
                        ? "font-medium text-berry"
                        : row.indent
                          ? "text-ink-faint"
                          : "text-ink-soft"
                    }`}
                  >
                    {row.label}
                  </dt>
                  <dd
                    className={`text-sm tabular-nums ${
                      row.highlight ? "font-semibold text-berry" : "text-plum"
                    }`}
                  >
                    {row.value}
                    {row.unit}
                  </dd>
                </div>
              ))}
              {net != null && (
                <div className="mt-4 flex items-baseline justify-between rounded-xl bg-cloud/70 px-4 py-3">
                  <dt className="text-sm font-medium text-plum">Net carbs</dt>
                  <dd className="text-lg font-semibold tabular-nums text-berry">
                    {net} g
                  </dd>
                </div>
              )}
            </dl>

            {dessert.sweetener && (
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                <span className="font-medium text-plum">Sweetened with:</span>{" "}
                {dessert.sweetener}
              </p>
            )}

            <p className="mt-5 text-[0.68rem] leading-relaxed text-ink-faint">
              Figures are careful estimates from our own recipes, not a
              laboratory analysis, and not medical advice. If you are managing
              diabetes, please read the ingredients and talk to your care team.
            </p>
          </Reveal>

          <Reveal delay={220} className="space-y-8">
            {dessert.story && (
              <div className="card-plinth rounded-[1.75rem] p-8">
                <h2 className="text-2xl">Why this one exists</h2>
                <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                  {dessert.story}
                </p>
              </div>
            )}

            {dessert.scripture && (
              <div className="rounded-[1.75rem] border border-rose/40 bg-gradient-to-br from-cloud to-white p-8">
                <p className="verse">“{dessert.scripture}”</p>
                <p className="mt-3 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-candy">
                  {dessert.scriptureRef}
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── What guests said ────────────────────────────────── */}
      {dessert.reviews.length > 0 && (
        <section className="py-16">
          <div className="shell">
            <Reveal className="text-center">
              <p className="eyebrow">From the people who ate it</p>
              <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">Kind words</h2>
            </Reveal>
            <div className="mt-12 grid gap-7 md:grid-cols-2">
              {dessert.reviews.map((review, index) => (
                <Reveal key={review.id} delay={index * 100}>
                  <TestimonialCard review={review} />
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-10 text-center">
              <Link href="/testimonials" className="btn btn-ghost">
                Leave your own
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Also on display ─────────────────────────────────── */}
      {related.length > 0 && (
        <section className="pb-24 pt-8">
          <div className="shell">
            <Reveal className="rule-ornament mb-10">
              <span className="text-[0.65rem] uppercase tracking-[0.28em]">
                Also on display
              </span>
            </Reveal>
            <div className="grid gap-7 sm:grid-cols-3">
              {related.map((item, index) => (
                <Reveal key={item.id} delay={index * 110}>
                  <Link
                    href={`/gallery/${item.slug}`}
                    className="card-plinth group block overflow-hidden rounded-[1.5rem]"
                  >
                    <div className="relative aspect-4/5 overflow-hidden">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.imageAlt ?? item.name}
                          fill
                          sizes="(min-width: 640px) 30vw, 90vw"
                          className="object-cover transition-transform duration-[1.4s] group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl">{item.name}</h3>
                      <p className="mt-1.5 text-sm text-ink-faint">
                        {formatMoney(item.priceCents)} · {item.unitLabel}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="text-2xl text-plum"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-[0.58rem] uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </p>
    </div>
  );
}
