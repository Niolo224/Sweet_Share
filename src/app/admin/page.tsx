import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import StatusPill from "@/components/admin/StatusPill";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    openOrders,
    pendingReviews,
    subscribers,
    unreadMessages,
    upcomingEvents,
    monthOrders,
    recentOrders,
    liveMenu,
  ] = await Promise.all([
    prisma.order.count({
      where: { status: { in: ["pending", "confirmed", "baking", "ready"] } },
    }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.message.count({ where: { isRead: false } }),
    prisma.event.count({
      where: { isPublished: true, startsAt: { gte: new Date() } },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth }, status: { not: "cancelled" } },
      select: { totalCents: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { items: true },
    }),
    prisma.menu.findFirst({ where: { isActive: true } }),
  ]);

  const monthTotal = monthOrders.reduce((sum, o) => sum + o.totalCents, 0);

  const stats = [
    { label: "Open orders", value: openOrders, href: "/admin/orders" },
    {
      label: "This month",
      value: formatMoney(monthTotal),
      href: "/admin/orders",
    },
    { label: "Reviews waiting", value: pendingReviews, href: "/admin/reviews" },
    { label: "On the email list", value: subscribers, href: "/admin/subscribers" },
    { label: "Unread messages", value: unreadMessages, href: "/admin/messages" },
    { label: "Gatherings coming", value: upcomingEvents, href: "/admin/events" },
  ];

  return (
    <div>
      <h1 className="text-4xl">Good to see you</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {liveMenu ? (
          <>
            Your live menu is{" "}
            <Link href="/admin/menus" className="text-berry underline">
              {liveMenu.title}
            </Link>
            .
          </>
        ) : (
          <>
            No menu is published yet —{" "}
            <Link href="/admin/menus" className="text-berry underline">
              publish one
            </Link>
            .
          </>
        )}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card-plinth rounded-2xl p-6"
          >
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-candy">
              {stat.label}
            </p>
            <p
              className="mt-2 text-4xl leading-none text-plum"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {pendingReviews > 0 && (
        <div className="mt-8 rounded-2xl border border-gold/50 bg-gold/10 p-5">
          <p className="text-sm text-plum">
            <strong>{pendingReviews}</strong>{" "}
            {pendingReviews === 1 ? "review is" : "reviews are"} waiting for
            your approval.{" "}
            <Link href="/admin/reviews" className="text-berry underline">
              Read them
            </Link>
            .
          </p>
        </div>
      )}

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs text-berry underline">
            See all
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="rounded-2xl border border-blush/60 bg-white/50 p-8 text-center text-sm text-ink-faint">
            No orders yet. They will appear here the moment someone places one.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-blush/60 bg-white/60">
            <table className="w-full text-left text-sm">
              <thead className="bg-cloud/50 text-[0.62rem] uppercase tracking-[0.14em] text-ink-faint">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Guest</th>
                  <th className="px-5 py-3 font-medium">For</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blush/50">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3.5 font-medium text-plum">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {order.customerName}
                      <span className="block text-xs text-ink-faint">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft">
                      {formatDate(order.requestedDate, "short")}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-plum">
                      {formatMoney(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl">Quick things</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/desserts/new", label: "Add a dessert" },
            { href: "/admin/menus", label: "Publish a menu" },
            { href: "/admin/events", label: "Add a gathering" },
            { href: "/admin/settings", label: "Edit site copy" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-blush/60 bg-white/50 p-5 text-center text-sm text-ink-soft transition-colors hover:border-rose hover:text-berry"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
