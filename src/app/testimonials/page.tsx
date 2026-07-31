import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ReviewForm from "@/components/ReviewForm";
import TestimonialCard from "@/components/TestimonialCard";
import SparkleField from "@/components/SparkleField";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kind Words — reviews from our guests",
  description:
    "What guests say about Sweet Share: reviews from people managing diabetes, feeding allergies, catering for churches, and just wanting something sweet. We publish the four-star ones too.",
  alternates: { canonical: "/testimonials" },
  openGraph: {
    title: "Kind Words · Sweet Share",
    description:
      "Reviews from people managing diabetes, feeding allergies, and just wanting something sweet.",
    url: "/testimonials",
  },
};

export default async function TestimonialsPage() {
  const [reviews, desserts] = await Promise.all([
    prisma.review.findMany({
      where: { status: "approved" },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      include: { dessert: { select: { name: true, slug: true } } },
    }),
    prisma.dessert.findMany({
      where: { isAvailable: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const count = reviews.length;
  const average =
    count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <>
      <header className="light-shaft relative overflow-hidden pb-10 pt-20">
        <SparkleField count={18} />
        <div className="shell relative text-center">
          <p className="eyebrow">From our table to yours</p>
          <h1 className="mt-4 text-[clamp(2.8rem,8vw,6rem)]">Kind Words</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            Every review here was written by a real guest and read by a real
            person before it went up. We publish the four-star ones too.
          </p>
        </div>
      </header>

      {count > 0 && (
        <section className="pb-6 pt-4">
          <div className="shell">
            <Reveal className="card-plinth mx-auto grid max-w-3xl gap-8 rounded-[1.75rem] p-8 sm:grid-cols-[auto_1fr] sm:p-10">
              <div className="text-center sm:border-r sm:border-blush/60 sm:pr-10">
                <p
                  className="text-6xl leading-none text-berry"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {average.toFixed(1)}
                </p>
                <p className="mt-2 text-gold">
                  {"★".repeat(Math.round(average))}
                  <span className="text-cloud-2">
                    {"★".repeat(5 - Math.round(average))}
                  </span>
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  {count} {count === 1 ? "review" : "reviews"}
                </p>
              </div>

              <div className="space-y-2">
                {distribution.map((row) => (
                  <div key={row.star} className="flex items-center gap-3">
                    <span className="w-8 shrink-0 text-xs text-ink-faint">
                      {row.star} ★
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-cloud-2/70">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose to-berry transition-[width] duration-700"
                        style={{
                          width: `${count ? (row.count / count) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink-faint">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="shell">
          {count === 0 ? (
            <Reveal className="mx-auto max-w-xl text-center">
              <h2 className="text-3xl">No words yet</h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">
                Be the first. If you have eaten something of ours, we would love
                to hear how it went.
              </p>
            </Reveal>
          ) : (
            <div className="columns-1 gap-7 md:columns-2 lg:columns-3">
              {reviews.map((review, index) => (
                <Reveal
                  key={review.id}
                  delay={Math.min(index * 70, 420)}
                  className="mb-7 break-inside-avoid"
                >
                  <TestimonialCard review={review} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-24">
        <div className="shell">
          <Reveal className="mx-auto max-w-2xl">
            <div className="mb-10 text-center">
              <p className="eyebrow">Your turn</p>
              <h2 className="mt-4 text-[clamp(2rem,4.5vw,3rem)]">
                Tell us how it went
              </h2>
            </div>
            <ReviewForm desserts={desserts} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
