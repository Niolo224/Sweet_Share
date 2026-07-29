import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import DessertCard from "@/components/DessertCard";
import GentleScale, { type ScaleItem } from "@/components/GentleScale";
import TestimonialCard from "@/components/TestimonialCard";
import NewsletterForm from "@/components/NewsletterForm";
import SparkleField from "@/components/SparkleField";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { media, mediaAlt, mediaVideo } from "@/lib/media";
import { formatDate, netCarbs } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PROMISES = [
  { title: "No dairy", body: "Not a drop. Coconut, cashew and oat do the work." },
  { title: "No eggs", body: "Flax and chia bind everything we bake." },
  { title: "No refined sugar", body: "Dates, monk fruit and allulose only." },
  { title: "Kind to blood sugar", body: "Net carbs and glycemic load on every label." },
];

/** Typical published values for an equivalent conventional serving. */
const CONVENTIONAL: Record<string, { net: number; added: number; note: string }> = {
  "chocolate-chip-cookies": {
    net: 22,
    added: 14,
    note: "A bakery chocolate chip cookie is roughly half sugar by weight once you account for the chips. We sweeten with allulose and monk fruit, neither of which the body metabolises for energy.",
  },
  "cashew-cheesecake": {
    net: 32,
    added: 24,
    note: "A New York cheesecake is cream cheese, eggs and a great deal of white sugar on a biscuit base. Ours is soaked cashews, coconut cream and lemon on an oat-almond crust — the same weight and the same tang, arrived at from a completely different direction.",
  },
  "double-chocolate-cookies": {
    net: 24,
    added: 16,
    note: "Double chocolate usually means double sugar, because cocoa is bitter and sugar is how bakeries fix that. We use unsweetened raw cacao and let the allulose do the sweetening, so the fibre goes up while the sugar goes to nothing.",
  },
};

export default async function HomePage() {
  const [settings, featured, reviews, events, scaleSource] = await Promise.all([
    getSettings(),
    prisma.dessert.findMany({
      where: { isFeatured: true, isAvailable: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    prisma.review.findMany({
      where: { status: "approved", isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { dessert: { select: { name: true, slug: true } } },
    }),
    prisma.event.findMany({
      where: { isPublished: true, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 2,
    }),
    prisma.dessert.findMany({
      where: { slug: { in: Object.keys(CONVENTIONAL) } },
      select: {
        slug: true,
        name: true,
        totalCarbsG: true,
        fiberG: true,
        sugarAlcoholG: true,
        addedSugarsG: true,
      },
    }),
  ]);

  const scaleItems: ScaleItem[] = scaleSource
    .map((d) => {
      const reference = CONVENTIONAL[d.slug];
      return {
        slug: d.slug,
        name: d.name.replace(/^The /, ""),
        netCarbsG: netCarbs(d.totalCarbsG, d.fiberG, d.sugarAlcoholG) ?? 0,
        addedSugarsG: d.addedSugarsG ?? 0,
        conventionalNetCarbsG: reference.net,
        conventionalAddedSugarsG: reference.added,
        note: reference.note,
      };
    })
    .sort((a, b) => a.netCarbsG - b.netCarbsG);

  return (
    <>
      <Hero
        imageUrl={media("hero")}
        imageAlt={mediaAlt("hero")}
        videoUrl={mediaVideo("hero")}
        eyebrow={settings.heroEyebrow}
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        verse={settings.heroVerse}
        verseRef={settings.heroVerseRef}
      />

      {/* ── The four promises ───────────────────────────────── */}
      <section className="light-shaft relative py-20">
        <div className="shell">
          <div className="grid gap-px overflow-hidden rounded-[1.75rem] border border-blush/60 bg-blush/40 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((promise, index) => (
              <Reveal
                key={promise.title}
                delay={index * 90}
                className="bg-gradient-to-b from-white/90 to-cloud/60 p-8 text-center"
              >
                <h3 className="text-2xl text-plum">{promise.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                  {promise.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── The gallery ─────────────────────────────────────── */}
      <section className="relative py-16">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">On the pedestals this season</p>
            <h2 className="mt-4 text-[clamp(2.4rem,5.5vw,4rem)]">
              The Gallery
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-soft">
              Each dessert is exhibited with its full ingredient list, its
              nutrition, and an honest word about how it lands on blood sugar.
              Nothing hidden, nothing to squint at.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((dessert, index) => (
              <Reveal key={dessert.id} delay={index * 110}>
                <DessertCard dessert={dessert} priority={index < 2} />
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12 text-center">
            <Link href="/gallery" className="btn btn-ghost">
              See the whole collection
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── The Gentle Scale ────────────────────────────────── */}
      {scaleItems.length > 0 && (
        <section className="relative py-20">
          <div className="shell">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Interactive</p>
              <h2 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)]">
                The Gentle Scale
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-soft">
                Pick a dessert and see it beside the version you would find at
                an ordinary bakery. We would rather show you the numbers than
                ask you to take our word for it.
              </p>
            </Reveal>

            <Reveal delay={140} className="mx-auto mt-12 max-w-5xl">
              <GentleScale items={scaleItems} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Mission ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20">
        <SparkleField count={18} />
        <div className="shell relative">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <div className="halo relative aspect-3/2 overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-lifted)]">
                <Image
                  src={media("sharing")}
                  alt={mediaAlt("sharing")}
                  fill
                  sizes="(min-width: 1024px) 46rem, 90vw"
                  className="object-cover"
                />
              </div>
            </Reveal>

            <Reveal delay={140}>
              <p className="eyebrow">Why we bake</p>
              <h2 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)]">
                {settings.missionTitle}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-ink-soft">
                {settings.missionBody}
              </p>

              <div className="mt-8 rounded-2xl border border-rose/40 bg-white/60 p-6">
                <p className="verse">
                  “Do not neglect to do good and to share what you have, for
                  such sacrifices are pleasing to God.”
                </p>
                <p className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-candy">
                  Hebrews 13:16
                </p>
              </div>

              <Link href="/story" className="btn btn-ghost mt-8">
                Read our story
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Kind words ──────────────────────────────────────── */}
      {reviews.length > 0 && (
        <section className="relative py-20">
          <div className="shell">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">From our table</p>
              <h2 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)]">
                Kind words
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-7 md:grid-cols-3">
              {reviews.map((review, index) => (
                <Reveal key={review.id} delay={index * 110}>
                  <TestimonialCard review={review} />
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-12 text-center">
              <Link href="/testimonials" className="btn btn-ghost">
                Read them all, or leave your own
              </Link>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Gatherings ──────────────────────────────────────── */}
      {events.length > 0 && (
        <section className="relative py-20">
          <div className="shell">
            <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <Reveal>
                <p className="eyebrow">Come and sit down</p>
                <h2 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)]">
                  Gatherings
                </h2>
                <p className="mt-6 text-base leading-relaxed text-ink-soft">
                  A dessert is better with people around it. We host tastings,
                  workshops and long-table suppers — most of them free, all of
                  them open to anyone.
                </p>
                <Link href="/gatherings" className="btn btn-ghost mt-8">
                  See what is coming
                </Link>
              </Reveal>

              <Reveal delay={140} className="space-y-5">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/gatherings#${event.slug}`}
                    className="card-plinth flex items-center gap-5 overflow-hidden rounded-2xl p-5"
                  >
                    <div className="placard grid h-16 w-16 shrink-0 place-items-center rounded-xl text-center">
                      <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-candy">
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                        }).format(event.startsAt)}
                      </span>
                      <span
                        className="block text-xl leading-none text-plum"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {new Intl.DateTimeFormat("en-US", {
                          day: "numeric",
                        }).format(event.startsAt)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-xl">{event.title}</h3>
                      <p className="mt-1 text-sm text-ink-faint">
                        {formatDate(event.startsAt)} · {event.location}
                      </p>
                    </div>
                  </Link>
                ))}
              </Reveal>
            </div>
          </div>
        </section>
      )}

      {/* ── Join the table ──────────────────────────────────── */}
      <section className="relative py-20">
        <div className="shell">
          <Reveal className="light-shaft relative overflow-hidden rounded-[2rem] border border-rose/40 bg-gradient-to-br from-cloud via-white to-lavender-soft/60 px-8 py-16 text-center sm:px-16">
            <SparkleField count={22} />
            <div className="relative mx-auto max-w-xl">
              <p className="eyebrow">Never miss a menu</p>
              <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">
                Join the table
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-soft">
                New menus, gathering invitations and the occasional word of
                encouragement. Once or twice a month, and never more.
              </p>
              <div className="mx-auto mt-8 max-w-lg text-left">
                <NewsletterForm source="homepage" compact />
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
