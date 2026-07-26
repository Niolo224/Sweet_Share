import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { Stars } from "@/components/TestimonialCard";
import StatusPill from "@/components/admin/StatusPill";
import SubmitButton from "@/components/admin/SubmitButton";
import {
  setReviewStatusAction,
  toggleReviewFeaturedAction,
  replyToReviewAction,
  deleteReviewAction,
} from "../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "approved", "rejected"];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = status && STATUSES.includes(status) ? status : "pending";

  const [reviews, counts] = await Promise.all([
    prisma.review.findMany({
      where: { status: filter },
      orderBy: { createdAt: "desc" },
      include: { dessert: { select: { name: true } } },
      take: 100,
    }),
    prisma.review.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (value: string) =>
    counts.find((c) => c.status === value)?._count ?? 0;

  return (
    <div>
      <h1 className="text-4xl">Reviews</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Nothing appears on the site until you approve it. Approving a review
        publishes it on the testimonials page straight away.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((value) => (
          <a
            key={value}
            href={`/admin/reviews?status=${value}`}
            className={`rounded-full border px-4 py-1.5 text-xs capitalize transition-colors ${
              filter === value
                ? "border-transparent bg-gradient-to-r from-rose to-berry text-white"
                : "border-blush bg-white/60 text-ink-soft hover:border-rose hover:text-berry"
            }`}
          >
            {value} ({countFor(value)})
          </a>
        ))}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-blush/60 bg-white/50 p-10 text-center text-sm text-ink-faint">
          Nothing {filter} right now.
        </p>
      ) : (
        <div className="mt-8 space-y-5">
          {reviews.map((review) => (
            <article key={review.id} className="card-plinth rounded-2xl p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars rating={review.rating} />
                    <StatusPill status={review.status} />
                    {review.isVerified && (
                      <span className="text-[0.6rem] uppercase tracking-[0.14em] text-ink-faint">
                        ✓ Has ordered
                      </span>
                    )}
                    {review.isFeatured && (
                      <span className="badge">Featured</span>
                    )}
                  </div>

                  {review.title && (
                    <h2 className="mt-3 text-xl">{review.title}</h2>
                  )}
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                    {review.body}
                  </p>
                  <p className="mt-3 text-xs text-ink-faint">
                    {review.name}
                    {review.location ? ` · ${review.location}` : ""}
                    {review.email ? ` · ${review.email}` : ""}
                    {review.dessert ? ` · on ${review.dessert.name}` : ""} ·{" "}
                    {formatDateTime(review.createdAt)}
                  </p>
                </div>
              </div>

              <form
                action={replyToReviewAction}
                className="mt-5 border-t border-blush/50 pt-5"
              >
                <input type="hidden" name="id" value={review.id} />
                <label className="label" htmlFor={`reply-${review.id}`}>
                  Reply from the kitchen — shown publicly beneath the review
                </label>
                <textarea
                  id={`reply-${review.id}`}
                  name="reply"
                  rows={2}
                  defaultValue={review.reply ?? ""}
                  className="field resize-y"
                  placeholder="Optional. A short, warm word back."
                />
                <SubmitButton
                  className="mt-3 rounded-full border border-blush px-4 py-2 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                  pendingLabel="Saving…"
                >
                  Save reply
                </SubmitButton>
              </form>

              <div className="mt-5 flex flex-wrap gap-2.5 border-t border-blush/50 pt-5">
                {review.status !== "approved" && (
                  <form action={setReviewStatusAction}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="status" value="approved" />
                    <SubmitButton
                      className="rounded-full bg-gradient-to-r from-rose to-berry px-4 py-2 text-xs text-white"
                      pendingLabel="…"
                    >
                      Approve & publish
                    </SubmitButton>
                  </form>
                )}

                {review.status !== "rejected" && (
                  <form action={setReviewStatusAction}>
                    <input type="hidden" name="id" value={review.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <SubmitButton
                      className="rounded-full border border-blush px-4 py-2 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                      pendingLabel="…"
                    >
                      Reject
                    </SubmitButton>
                  </form>
                )}

                {review.status === "approved" && (
                  <form action={toggleReviewFeaturedAction}>
                    <input type="hidden" name="id" value={review.id} />
                    <SubmitButton
                      className="rounded-full border border-blush px-4 py-2 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                      pendingLabel="…"
                    >
                      {review.isFeatured ? "Unfeature" : "Feature on home page"}
                    </SubmitButton>
                  </form>
                )}

                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={review.id} />
                  <SubmitButton
                    className="rounded-full border border-berry/40 px-4 py-2 text-xs text-berry transition-colors hover:bg-berry/10"
                    pendingLabel="…"
                    confirm="Delete this review permanently?"
                  >
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
