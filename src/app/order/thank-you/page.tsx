import type { Metadata } from "next";
import Link from "next/link";
import SparkleField from "@/components/SparkleField";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string }>;
}) {
  const { number } = await searchParams;

  return (
    <section className="light-shaft relative overflow-hidden py-28">
      <SparkleField count={30} />
      <div className="shell relative">
        <div className="mx-auto max-w-2xl text-center">
          <div className="animate-levitate mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-rose via-candy to-berry text-4xl text-white shadow-[var(--shadow-halo)]">
            ♥
          </div>

          <p className="eyebrow">Received with joy</p>
          <h1 className="mt-4 text-[clamp(2.4rem,6vw,4.5rem)]">Thank you</h1>

          {number && (
            <p className="placard mx-auto mt-8 inline-flex items-center gap-3 rounded-full px-6 py-3">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-candy">
                Your order
              </span>
              <span
                className="text-xl text-plum"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {number}
              </span>
            </p>
          )}

          <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-ink-soft">
            Your request is in our hands. A real person will read it and reply
            to confirm the details — usually the same day, always within one.
            Payment comes after we have confirmed, never before.
          </p>

          <div className="mt-6 rounded-2xl border border-rose/40 bg-white/60 p-6">
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
            <Link href="/gatherings" className="btn btn-primary btn-sheen">
              See our gatherings
            </Link>
          </div>

          <div className="mx-auto mt-14 max-w-lg border-t border-blush/60 pt-10 text-left">
            <p className="mb-4 text-center text-sm text-ink-soft">
              While you wait — new menus, once or twice a month.
            </p>
            <NewsletterForm source="thank-you" compact />
          </div>
        </div>
      </div>
    </section>
  );
}
