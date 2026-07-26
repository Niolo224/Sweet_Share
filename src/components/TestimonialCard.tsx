import Link from "next/link";
import { formatDate } from "@/lib/utils";

type Review = {
  id: string;
  name: string;
  location: string | null;
  rating: number;
  title: string | null;
  body: string;
  isVerified: boolean;
  reply: string | null;
  createdAt: Date;
  dessert?: { name: string; slug: string } | null;
};

export function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={`h-4 w-4 ${n <= rating ? "text-gold" : "text-cloud-2"}`}
          fill="currentColor"
        >
          <path d="M10 1.6l2.47 5.28 5.53.72-4.06 3.9 1.03 5.68L10 14.4l-4.97 2.78 1.03-5.68-4.06-3.9 5.53-.72L10 1.6Z" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialCard({ review }: { review: Review }) {
  return (
    <figure className="card-plinth flex h-full flex-col rounded-[1.5rem] p-7">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={review.rating} />
        {review.isVerified && (
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.14em] text-ink-faint">
            <span className="text-candy">✓</span> Verified guest
          </span>
        )}
      </div>

      {review.title && (
        <h3 className="mt-4 text-xl leading-snug">{review.title}</h3>
      )}

      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
        “{review.body}”
      </blockquote>

      {review.reply && (
        <div className="mt-4 rounded-xl border-l-2 border-rose bg-cloud/50 px-4 py-3">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-candy">
            From the kitchen
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            {review.reply}
          </p>
        </div>
      )}

      <figcaption className="mt-6 border-t border-blush/60 pt-4">
        <p className="text-sm font-medium text-plum">{review.name}</p>
        <p className="mt-0.5 text-xs text-ink-faint">
          {[review.location, formatDate(review.createdAt, "short")]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {review.dessert && (
          <Link
            href={`/gallery/${review.dessert.slug}`}
            className="mt-2 inline-block text-xs text-candy transition-colors hover:text-berry"
          >
            on {review.dessert.name} →
          </Link>
        )}
      </figcaption>
    </figure>
  );
}
