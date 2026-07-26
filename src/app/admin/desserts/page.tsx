import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import SubmitButton from "@/components/admin/SubmitButton";
import { deleteDessertAction, toggleDessertAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminDessertsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdmin();
  const { saved } = await searchParams;

  const desserts = await prisma.dessert.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { orderItems: true, reviews: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Desserts</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Everything in your gallery. Changes appear on the site immediately.
          </p>
        </div>
        <Link href="/admin/desserts/new" className="btn btn-primary btn-sheen">
          Add a dessert
        </Link>
      </div>

      {saved && (
        <p className="mt-6 rounded-xl border border-rose/40 bg-cloud/60 px-4 py-3 text-sm text-plum">
          Saved. Your gallery is updated.
        </p>
      )}

      {desserts.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-blush/60 bg-white/50 p-10 text-center text-sm text-ink-faint">
          Nothing in the gallery yet. Add your first dessert.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {desserts.map((dessert) => (
            <div
              key={dessert.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-blush/60 bg-white/60 p-4"
            >
              <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-cloud">
                {dessert.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dessert.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-[12rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg text-plum">{dessert.name}</h2>
                  {dessert.isFeatured && <span className="badge">Featured</span>}
                  {!dessert.isAvailable && (
                    <span className="rounded-full bg-berry/10 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-berry">
                      Resting
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {dessert.category} · {formatMoney(dessert.priceCents)} ·{" "}
                  {dessert.unitLabel} · {dessert._count.orderItems} ordered ·{" "}
                  {dessert._count.reviews} reviews
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/gallery/${dessert.slug}`}
                  target="_blank"
                  className="rounded-full border border-blush px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                >
                  View ↗
                </Link>
                <Link
                  href={`/admin/desserts/${dessert.id}`}
                  className="rounded-full border border-blush px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                >
                  Edit
                </Link>

                <form action={toggleDessertAction}>
                  <input type="hidden" name="id" value={dessert.id} />
                  <SubmitButton
                    className="rounded-full border border-blush px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                    pendingLabel="…"
                  >
                    {dessert.isAvailable ? "Rest it" : "Bring it back"}
                  </SubmitButton>
                </form>

                <form action={deleteDessertAction}>
                  <input type="hidden" name="id" value={dessert.id} />
                  <SubmitButton
                    className="rounded-full border border-berry/40 px-3.5 py-1.5 text-xs text-berry transition-colors hover:bg-berry/10"
                    pendingLabel="…"
                    confirm={`Delete ${dessert.name} permanently? Past orders keep their record.`}
                  >
                    Delete
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
