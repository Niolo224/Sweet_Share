import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import { PLANS, findPlan } from "@/lib/plans";
import StatusPill from "@/components/admin/StatusPill";
import SubmitButton from "@/components/admin/SubmitButton";
import { cancelSubscriptionAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminClubPage() {
  await requireAdmin();

  const [members, active, upcomingBoxes] = await Promise.all([
    prisma.subscription.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { _count: { select: { orders: true } } },
      take: 200,
    }),
    prisma.subscription.findMany({
      where: { status: { in: ["active", "past_due"] } },
      select: { plan: true, priceCents: true, status: true },
    }),
    prisma.order.findMany({
      where: {
        subscriptionId: { not: null },
        status: { in: ["confirmed", "baking", "ready"] },
      },
      orderBy: { requestedDate: "asc" },
      take: 10,
    }),
  ]);

  const mrr = active
    .filter((m) => m.status === "active")
    .reduce((sum, m) => sum + m.priceCents, 0);

  const byPlan = PLANS.map((plan) => ({
    plan,
    count: active.filter((m) => m.plan === plan.key).length,
  }));

  return (
    <div>
      <h1 className="text-4xl">The Club</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Standing orders. Every month Stripe takes payment and a kitchen order
        appears in <Link href="/admin/orders" className="text-berry underline">Orders</Link>{" "}
        automatically, already marked paid.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Monthly recurring" value={formatMoney(mrr)} />
        <Stat
          label="Active members"
          value={active.filter((m) => m.status === "active").length}
        />
        <Stat
          label="Payment failing"
          value={active.filter((m) => m.status === "past_due").length}
          note={
            active.some((m) => m.status === "past_due")
              ? "Stripe is retrying; no box raised"
              : undefined
          }
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {byPlan.map(({ plan, count }) => (
          <span key={plan.key} className="badge">
            {plan.name}: {count}
          </span>
        ))}
      </div>

      {upcomingBoxes.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-2xl">Boxes to bake</h2>
          <div className="overflow-hidden rounded-2xl border border-blush/60 bg-white/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-cloud/50 text-[0.62rem] uppercase tracking-[0.14em] text-ink-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Box</th>
                  <th className="px-5 py-3 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush/50">
                {upcomingBoxes.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3 font-medium text-plum">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {order.customerName}
                      <span className="block text-xs text-ink-faint">
                        {order.fulfillment === "delivery"
                          ? "Delivery"
                          : "Collection"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {order.occasion?.replace("Club box — ", "") ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {formatDate(order.requestedDate, "short")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 text-2xl">Members</h2>

        {members.length === 0 ? (
          <p className="rounded-2xl border border-blush/60 bg-white/50 p-10 text-center text-sm text-ink-faint">
            Nobody has joined yet. The club lives at{" "}
            <Link href="/club" className="text-berry underline">
              /club
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const plan = findPlan(member.plan);
              return (
                <article
                  key={member.id}
                  className="rounded-2xl border border-blush/60 bg-white/60 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-lg text-plum">
                          {member.customerName}
                        </h3>
                        <StatusPill status={member.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-faint">
                        <a
                          href={`mailto:${member.email}`}
                          className="underline hover:text-berry"
                        >
                          {member.email}
                        </a>
                        {member.phone ? ` · ${member.phone}` : ""} ·{" "}
                        {member.fulfillment === "delivery"
                          ? "Delivery"
                          : "Collection"}{" "}
                        · {member._count.orders}{" "}
                        {member._count.orders === 1 ? "box" : "boxes"} so far
                      </p>
                      {member.address && (
                        <p className="mt-1 text-xs text-ink-faint">
                          {[member.address, member.city, member.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {member.dietaryNotes && (
                        <p className="mt-2 rounded-lg bg-gold/15 px-3 py-2 text-xs text-ink-soft">
                          <strong>Dietary:</strong> {member.dietaryNotes}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p
                        className="text-xl text-berry"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {formatMoney(member.priceCents)}
                      </p>
                      <p className="text-[0.65rem] text-ink-faint">
                        {plan?.name ?? member.plan} · monthly
                      </p>
                      {member.currentPeriodEnd && (
                        <p className="mt-1 text-[0.65rem] text-ink-faint">
                          Renews {formatDate(member.currentPeriodEnd, "short")}
                        </p>
                      )}
                    </div>
                  </div>

                  {["active", "past_due", "paused"].includes(member.status) && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-blush/50 pt-4">
                      <a
                        href={`mailto:${member.email}?subject=${encodeURIComponent("Your Sweet Share Club box")}`}
                        className="rounded-full border border-blush px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                      >
                        Email member
                      </a>
                      <form action={cancelSubscriptionAction}>
                        <input type="hidden" name="id" value={member.id} />
                        <SubmitButton
                          className="rounded-full border border-berry/40 px-3.5 py-1.5 text-xs text-berry transition-colors hover:bg-berry/10"
                          pendingLabel="Cancelling…"
                          confirm={`Cancel ${member.customerName}'s membership? Stripe stops billing immediately.`}
                        >
                          Cancel membership
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="card-plinth rounded-2xl p-6">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-candy">
        {label}
      </p>
      <p
        className="mt-2 text-3xl leading-none text-plum"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      {note && <p className="mt-1.5 text-[0.68rem] text-ink-faint">{note}</p>}
    </div>
  );
}
