import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import {
  tierFor,
  REWARD_THRESHOLD,
  REWARD_VALUE_CENTS,
  POINTS_PER_DOLLAR,
} from "@/lib/loyalty";
import AdjustPointsForm from "@/components/admin/AdjustPointsForm";

export const dynamic = "force-dynamic";

export default async function AdminLoyaltyPage() {
  await requireAdmin();

  const [accounts, totals, rewardsIssued, recent] = await Promise.all([
    prisma.loyaltyAccount.findMany({
      orderBy: { lifetimePoints: "desc" },
      take: 200,
    }),
    prisma.loyaltyAccount.aggregate({
      _sum: { points: true, lifetimePoints: true },
      _count: true,
    }),
    prisma.loyaltyAccount.aggregate({ _sum: { rewardsIssued: true } }),
    prisma.loyaltyEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { account: { select: { email: true, name: true } } },
    }),
  ]);

  const outstandingPoints = totals._sum.points ?? 0;
  // What those points will cost if every one of them is redeemed.
  const liabilityCents = Math.round(
    (outstandingPoints / REWARD_THRESHOLD) * REWARD_VALUE_CENTS,
  );

  return (
    <div>
      <h1 className="text-4xl">The Table</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Loyalty runs itself. Guests earn {POINTS_PER_DOLLAR} point per dollar
        paid, and at {REWARD_THRESHOLD} points a{" "}
        {formatMoney(REWARD_VALUE_CENTS)} gift card is minted and emailed
        automatically — no claiming, no expiry.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Guests earning" value={totals._count} />
        <Stat label="Points outstanding" value={outstandingPoints.toLocaleString()} />
        <Stat
          label="Future liability"
          value={formatMoney(liabilityCents)}
          note="If every point is redeemed"
        />
        <Stat
          label="Rewards sent"
          value={rewardsIssued._sum.rewardsIssued ?? 0}
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="order-2 space-y-8 lg:order-1">
          <section>
            <h2 className="mb-4 text-2xl">Guests</h2>
            {accounts.length === 0 ? (
              <p className="rounded-2xl border border-blush/60 bg-white/50 p-10 text-center text-sm text-ink-faint">
                Nobody is earning yet. Points start with the first paid order.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-blush/60 bg-white/60">
                <table className="w-full text-left text-sm">
                  <thead className="bg-cloud/50 text-[0.62rem] uppercase tracking-[0.14em] text-ink-faint">
                    <tr>
                      <th className="px-5 py-3 font-medium">Guest</th>
                      <th className="px-5 py-3 font-medium">Place</th>
                      <th className="px-5 py-3 text-right font-medium">Points</th>
                      <th className="px-5 py-3 text-right font-medium">Lifetime</th>
                      <th className="px-5 py-3 text-right font-medium">Rewards</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blush/50">
                    {accounts.map((account) => {
                      const tier = tierFor(account.lifetimePoints);
                      return (
                        <tr key={account.id}>
                          <td className="px-5 py-3">
                            <span className="text-plum">
                              {account.name ?? "—"}
                            </span>
                            <a
                              href={`mailto:${account.email}`}
                              className="block text-xs text-ink-faint underline hover:text-berry"
                            >
                              {account.email}
                            </a>
                          </td>
                          <td className="px-5 py-3">
                            <span className="badge">{tier.name}</span>
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-berry">
                            {account.points}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-ink-faint">
                            {account.lifetimePoints}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-ink-faint">
                            {account.rewardsIssued}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {recent.length > 0 && (
            <section>
              <h2 className="mb-4 text-2xl">Recent movement</h2>
              <div className="overflow-hidden rounded-2xl border border-blush/60 bg-white/60">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-blush/50">
                    {recent.map((event) => (
                      <tr key={event.id}>
                        <td className="px-5 py-2.5 text-xs text-ink-faint">
                          {formatDate(event.createdAt, "short")}
                        </td>
                        <td className="px-5 py-2.5 text-ink-soft">
                          {event.account.name ?? event.account.email}
                        </td>
                        <td className="px-5 py-2.5 text-xs capitalize text-ink-faint">
                          {event.reason.replace("_", " ")}
                          {event.orderNumber ? ` · ${event.orderNumber}` : ""}
                          {event.note ? ` · ${event.note}` : ""}
                        </td>
                        <td
                          className={`px-5 py-2.5 text-right tabular-nums ${
                            event.points > 0 ? "text-plum" : "text-berry"
                          }`}
                        >
                          {event.points > 0 ? "+" : ""}
                          {event.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="order-1 space-y-4 lg:order-2">
          <AdjustPointsForm />

          <div className="rounded-2xl border border-gold/50 bg-gold/10 p-5 text-sm leading-relaxed text-plum">
            <strong>On the liability figure.</strong> Outstanding points are a
            promise of future dessert, and the number above is what honouring
            all of them would cost. It is normal for it to grow — just keep an
            eye on it against your margins, and remember rewards become gift
            cards, which carry their own accounting note.
          </div>
        </div>
      </div>
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
