import type { Metadata } from "next";
import Link from "next/link";
import SparkleField from "@/components/SparkleField";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gift sent",
  robots: { index: false, follow: false },
};

export default async function GiftSentPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  const card = id
    ? await prisma.giftCard.findUnique({ where: { id } })
    : null;

  // Stripe redirects here at once; the webhook that activates the card may be
  // a beat behind, so the page never claims more than it knows.
  const active = card?.status === "active";

  return (
    <section className="light-shaft relative overflow-hidden py-28">
      <SparkleField count={30} />
      <div className="shell relative">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-levitate mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose via-candy to-berry text-4xl text-white shadow-[var(--shadow-halo)]">
            ♥
          </div>

          <p className="eyebrow">That was kind of you</p>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4.5rem)]">Gift sent</h1>

          {card && (
            <p className="placard mx-auto mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-candy">
                Value
              </span>
              <span
                className="text-xl text-plum"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {formatMoney(card.initialCents)}
              </span>
            </p>
          )}

          <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-ink-soft">
            {active && card?.recipientEmail ? (
              <>
                The card is on its way to{" "}
                <strong className="text-plum">
                  {card.recipientName ?? card.recipientEmail}
                </strong>
                , with your note. We have sent you a copy too, in case you would
                rather tell them yourself.
              </>
            ) : active ? (
              <>
                Your card is active and the code is in your inbox, ready for you
                to pass on however you like.
              </>
            ) : (
              <>
                Your payment has gone through and the card is being activated
                now — the code will be in the inbox within a minute or two. If
                it has not arrived, check your spam folder and then tell us.
              </>
            )}
          </p>

          <div className="mt-8 rounded-2xl border border-rose/40 bg-white/60 p-6">
            <p className="verse">
              “Each of you should use whatever gift you have received to serve
              others.”
            </p>
            <p className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-candy">
              1 Peter 4:10
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/gallery" className="btn btn-ghost">
              See what they can choose
            </Link>
            <Link href="/gift-cards" className="btn btn-primary btn-sheen">
              Send another
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
