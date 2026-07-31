import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GiftCardPurchase from "@/components/GiftCardPurchase";
import Reveal from "@/components/Reveal";
import SparkleField from "@/components/SparkleField";
import { media, mediaAlt } from "@/lib/media";

export const metadata: Metadata = {
  title: "Gift Cards — dessert for someone who thought it was off the table",
  description:
    "Send a Sweet Share gift card. Plant-based, diabetes-friendly desserts with no dairy, eggs or refined sugar. Emailed straight to them with your note. Never expires, and unspent balance stays on the card.",
  alternates: { canonical: "/gift-cards" },
  openGraph: {
    title: "Gift Cards · Sweet Share",
    description:
      "Dessert for someone who thought dessert was off the table. Never expires.",
    url: "/gift-cards",
  },
};

const REASONS = [
  {
    title: "For the newly diagnosed",
    body: "The hardest week is the one where somebody is told what they can no longer eat. A card says: not everything.",
  },
  {
    title: "When you have no words",
    body: "A loss, a diagnosis, a hard season. You do not have to know what to say to send something kind.",
  },
  {
    title: "For the host who feeds everyone",
    body: "The person who always brings the food. Let them be fed for once.",
  },
];

export default async function GiftCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { cancelled } = await searchParams;

  return (
    <>
      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={22} />
        <div className="shell relative text-center">
          <p className="eyebrow">Give something gentle</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,6rem)]">Gift Cards</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            For the person who has been told they cannot have dessert any more.
            Everything we bake is free of dairy, eggs and refined sugar — so
            whatever they choose, it will be kind to them.
          </p>
        </div>
      </header>

      <section className="py-12">
        <div className="shell grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <Reveal className="space-y-8 lg:sticky lg:top-28">
            <div className="halo relative aspect-4/5 overflow-hidden rounded-[2rem] shadow-[var(--shadow-lifted)]">
              <Image
                src={media("giftBox")}
                alt={mediaAlt("giftBox")}
                fill
                priority
                sizes="(min-width: 1024px) 34rem, 92vw"
                className="object-cover"
              />
            </div>

            <div className="space-y-4">
              {REASONS.map((reason) => (
                <div
                  key={reason.title}
                  className="rounded-2xl border border-blush/60 bg-white/50 p-5"
                >
                  <h2
                    className="text-lg"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {reason.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                    {reason.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="placard rounded-2xl p-6">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-candy">
                How it works
              </p>
              <ol className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                <li>
                  <strong className="text-plum">1.</strong> Choose an amount and
                  pay securely through Stripe.
                </li>
                <li>
                  <strong className="text-plum">2.</strong> We email the card
                  straight to them, with your note — or to you, to hand over
                  yourself.
                </li>
                <li>
                  <strong className="text-plum">3.</strong> They enter the code
                  at checkout. It never expires, and anything unspent stays on
                  the card.
                </li>
              </ol>
            </div>
          </Reveal>

          <Reveal delay={140}>
            {cancelled && (
              <p className="mb-6 rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-plum">
                No payment was taken — your card is still here whenever you are
                ready.
              </p>
            )}
            <GiftCardPurchase />

            <p className="mt-6 text-center text-sm text-ink-soft">
              Been given one?{" "}
              <Link href="/order" className="text-berry underline">
                Enter it at checkout
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
