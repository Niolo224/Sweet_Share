import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import SubmitButton from "@/components/admin/SubmitButton";
import { removeSubscriberAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  await requireAdmin();

  const [subscribers, total, gone, bySource] = await Promise.all([
    prisma.subscriber.findMany({
      where: { unsubscribedAt: null },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.subscriber.groupBy({
      by: ["source"],
      where: { unsubscribedAt: null },
      _count: true,
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Email list</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            Everyone who has asked to hear from you. Download the CSV to import
            into Mailchimp, Resend Broadcasts, Kit or whatever you send with.
          </p>
        </div>
        <a
          href="/api/admin/export?type=subscribers"
          className="btn btn-primary btn-sheen"
        >
          Download CSV
        </a>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Subscribed" value={total} />
        <Stat label="Unsubscribed" value={gone} />
        <Stat
          label="Top source"
          value={
            bySource.sort((a, b) => b._count - a._count)[0]?.source ?? "—"
          }
        />
      </div>

      {bySource.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {bySource
            .sort((a, b) => b._count - a._count)
            .map((row) => (
              <span key={row.source} className="badge">
                {row.source}: {row._count}
              </span>
            ))}
        </div>
      )}

      {subscribers.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-blush/60 bg-white/50 p-10 text-center text-sm text-ink-faint">
          Nobody yet. The signup form is in your footer and on the home page.
        </p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-blush/60 bg-white/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-cloud/50 text-[0.62rem] uppercase tracking-[0.14em] text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 text-right font-medium">—</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blush/50">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td className="px-5 py-3 text-plum">{subscriber.email}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {subscriber.name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-ink-faint">
                    {subscriber.source}
                  </td>
                  <td className="px-5 py-3 text-ink-faint">
                    {formatDate(subscriber.createdAt, "short")}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <form action={removeSubscriberAction}>
                      <input type="hidden" name="id" value={subscriber.id} />
                      <SubmitButton
                        className="text-xs text-ink-faint underline transition-colors hover:text-berry"
                        pendingLabel="…"
                        confirm={`Remove ${subscriber.email} from the list?`}
                      >
                        Remove
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-plinth rounded-2xl p-6">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-candy">
        {label}
      </p>
      <p
        className="mt-2 text-3xl capitalize leading-none text-plum"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
    </div>
  );
}
