import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SparkleField from "@/components/SparkleField";
import NewsletterForm from "@/components/NewsletterForm";
import { getSettings } from "@/lib/settings";
import { media, mediaAlt } from "@/lib/media";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Why Sweet Share exists: so that nobody has to sit out the dessert course. Our story, our mission, and the values we bake by.",
};

const VALUES = [
  {
    title: "Nobody sits out",
    body: "Every dessert we make is vegan, egg-free and free of refined sugar — not as a niche, but so one plate can go to the whole table. The person with diabetes and the person without eat the same thing.",
    verse: "Matthew 22:39",
  },
  {
    title: "Tell the truth",
    body: "Every ingredient is named. Every number is published. If something is richer than the rest of the menu, we say so on the label rather than hiding it in a footnote.",
    verse: "Proverbs 11:1",
  },
  {
    title: "Made, not manufactured",
    body: "Small batches, baked to order. We would rather sell out than keep something sitting. Nothing leaves this kitchen that we would not put in front of our own family.",
    verse: "Colossians 3:23",
  },
  {
    title: "Give some away",
    body: "Every Share Box sold funds one delivered free to a family walking through a hard week. It is not marketing. It is the reason the company has the name it has.",
    verse: "Hebrews 13:16",
  },
];

const CHAPTERS = [
  {
    year: "The diagnosis",
    title: "It started with a number",
    body: "A woman we love was told her blood sugar was too high, and she quietly stopped coming to birthdays. Not because anyone asked her to — because sitting at a table watching everyone else eat cake is its own kind of lonely. We noticed. We could not un-notice.",
  },
  {
    year: "Forty-one tries",
    title: "The cookie that took a year",
    body: "We knew nothing. We ruined a great deal of almond flour. Somewhere around the fortieth attempt we stopped trying to imitate a conventional cookie and started building one from what actually works — allulose, cashew butter, flax. The forty-first is still on the menu.",
  },
  {
    year: "The first table",
    title: "Word travelled faster than we did",
    body: "A church lunch, ninety people, every dietary need in the room. One dessert on every plate and nobody asking what was in it because it was written on the card. Three people asked for our number before the plates were cleared. We had no number to give them.",
  },
  {
    year: "Now",
    title: "A gallery, not a counter",
    body: "We built Sweet Share the way we wish every food shop worked: every dessert exhibited like it matters, every ingredient on the placard, every number in the open. Come and look before you buy. That is the whole idea.",
  },
];

export default async function StoryPage() {
  const settings = await getSettings();

  return (
    <>
      {/* ── Opening ─────────────────────────────────────────── */}
      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={20} />
        <div className="shell relative text-center">
          <p className="eyebrow">How we got here</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,6rem)]">
            {settings.storyTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Sweet Share began because someone we love stopped coming to
            birthdays. Everything below follows from that.
          </p>
        </div>
      </header>

      <div className="shell">
        <Reveal className="cloud-fade-b relative aspect-3/2 overflow-hidden rounded-[2rem]">
          <Image
            src={media("sharing")}
            alt={mediaAlt("sharing")}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </Reveal>
      </div>

      {/* ── Mission ─────────────────────────────────────────── */}
      <section className="py-20">
        <div className="shell">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">{settings.missionTitle}</p>
            <p className="mt-7 text-[clamp(1.4rem,3vw,2rem)] leading-[1.45] text-plum">
              {settings.missionBody}
            </p>
            <div className="rule-ornament mt-10">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M12 4c1.5 2.6 3.4 3.6 6 4-2.6.4-4.5 1.4-6 4-1.5-2.6-3.4-3.6-6-4 2.6-.4 4.5-1.4 6-4Z" />
              </svg>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Chapters ────────────────────────────────────────── */}
      <section className="py-12">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            {CHAPTERS.map((chapter, index) => (
              <Reveal
                key={chapter.title}
                delay={index * 90}
                className="relative border-l border-rose/40 pb-14 pl-10 last:pb-0"
              >
                <span className="absolute -left-[7px] top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-gradient-to-br from-rose to-berry shadow-[0_0_0_4px_var(--color-paper)]" />
                <p className="eyebrow">{chapter.year}</p>
                <h2 className="mt-3 text-[clamp(1.7rem,3.5vw,2.5rem)] leading-tight">
                  {chapter.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-ink-soft">
                  {chapter.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────── */}
      <section className="py-20">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What we hold to</p>
            <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">
              Four things we will not trade
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-7 md:grid-cols-2">
            {VALUES.map((value, index) => (
              <Reveal
                key={value.title}
                delay={index * 100}
                className="card-plinth rounded-[1.75rem] p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl leading-tight">{value.title}</h3>
                  <span className="shrink-0 text-[0.6rem] font-medium uppercase tracking-[0.16em] text-candy">
                    {value.verse}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  {value.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── The kitchen ─────────────────────────────────────── */}
      <section className="py-20">
        <div className="shell">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <div className="halo relative aspect-16/9 overflow-hidden rounded-[2rem] shadow-[var(--shadow-lifted)]">
                <Image
                  src={media("gathering")}
                  alt={mediaAlt("gathering")}
                  fill
                  sizes="(min-width: 1024px) 46rem, 90vw"
                  className="object-cover"
                />
              </div>
            </Reveal>

            <Reveal delay={140}>
              <p className="eyebrow">A note from our kitchen</p>
              <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">
                We are a small shop
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-soft">
                <p>
                  We bake to order, which means we ask for a few days&rsquo;
                  notice and occasionally have to say no to a rush. We think
                  that is a fair trade for food that has not been sitting.
                </p>
                <p>
                  We are a Christian family, and that shapes how we run this —
                  in the honesty of the labels, in the box we give away for
                  every one we sell, and in the fact that everyone is welcome at
                  this table. You do not have to share our faith to be fed by
                  us. That was never the arrangement.
                </p>
                <p>
                  If you are newly diagnosed, or newly plant-based, or just
                  tired of reading labels — write to us. We will help you find
                  something you can eat, even if it is not ours.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/gallery" className="btn btn-primary btn-sheen">
                  See the collection
                </Link>
                <Link href="/contact" className="btn btn-ghost">
                  Write to us
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Join ────────────────────────────────────────────── */}
      <section className="pb-24">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl rounded-[2rem] border border-rose/40 bg-gradient-to-br from-cloud to-white px-8 py-12 text-center sm:px-14">
            <h2 className="text-3xl">Walk with us</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              New menus, gathering invitations, and the occasional word of
              encouragement.
            </p>
            <div className="mt-8 text-left">
              <NewsletterForm source="story" compact />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
