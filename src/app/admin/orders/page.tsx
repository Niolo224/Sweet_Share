import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate, formatDateTime } from "@/lib/utils";
import StatusPill from "@/components/admin/StatusPill";
import SubmitButton from "@/components/admin/SubmitButton";
import {
  setOrderStatusAction,
  setPaymentStatusAction,
  sendPaymentLinkAction,
} from "../actions";
import { stripeConfigured, ACH_THRESHOLD_CENTS } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "baking",
  "ready",
  "fulfilled",
  "cancelled",
];
const PAYMENT_STATUSES = ["unpaid", "processing", "paid", "refunded"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sent?: string; problem?: string }>;
}) {
  await requireAdmin();
  const { status, sent, problem } = await searchParams;
  const stripeReady = stripeConfigured();

  const orders = await prisma.order.findMany({
    where: status && ORDER_STATUSES.includes(status) ? { status } : undefined,
    orderBy: [{ requestedDate: "asc" }, { createdAt: "desc" }],
    include: { items: true },
    take: 120,
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">Orders</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Sorted by the day each one is needed, soonest first.
          </p>
        </div>
        <a
          href="/api/admin/export?type=orders"
          className="rounded-full border border-blush px-4 py-2 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
        >
          Download CSV
        </a>
      </div>

      {sent && (
        <p className="mt-6 rounded-xl border border-rose/40 bg-cloud/60 px-4 py-3 text-sm text-plum">
          Payment link emailed for <strong>{sent}</strong>. The order moves to
          paid on its own the moment Stripe confirms.
        </p>
      )}
      {problem && (
        <p className="mt-6 rounded-xl bg-berry/10 px-4 py-3 text-sm text-berry">
          {problem}
        </p>
      )}
      {!stripeReady && (
        <p className="mt-6 rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-plum">
          Stripe is not configured, so payment links are unavailable. Add{" "}
          <code>STRIPE_SECRET_KEY</code> to your environment to switch them on.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterLink label="All" href="/admin/orders" active={!status} />
        {ORDER_STATUSES.map((value) => (
          <FilterLink
            key={value}
            label={value}
            href={`/admin/orders?status=${value}`}
            active={status === value}
          />
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-blush/60 bg-white/50 p-10 text-center text-sm text-ink-faint">
          Nothing here yet.
        </p>
      ) : (
        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <article
              key={order.id}
              className="card-plinth rounded-2xl p-6 sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2
                      className="text-2xl text-plum"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {order.orderNumber}
                    </h2>
                    <StatusPill status={order.status} />
                    <StatusPill status={order.paymentStatus} />
                  </div>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {order.customerName} ·{" "}
                    <a
                      href={`mailto:${order.email}`}
                      className="underline hover:text-berry"
                    >
                      {order.email}
                    </a>
                    {order.phone ? ` · ${order.phone}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-ink-faint">
                    Placed {formatDateTime(order.createdAt)}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="text-2xl text-berry"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {formatMoney(order.totalCents)}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {order.fulfillment === "delivery" ? "Delivery" : "Collection"}{" "}
                    {formatDate(order.requestedDate, "short")}
                  </p>
                  {order.timeWindow && (
                    <p className="text-xs text-ink-faint">{order.timeWindow}</p>
                  )}
                </div>
              </div>

              <ul className="mt-5 divide-y divide-blush/50 border-y border-blush/50">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between py-2.5 text-sm"
                  >
                    <span className="text-ink-soft">
                      {item.quantity} × {item.nameSnapshot}
                    </span>
                    <span className="tabular-nums text-plum">
                      {formatMoney(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {(order.address || order.occasion || order.dietaryNotes || order.notes) && (
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  {order.address && (
                    <Detail label="Deliver to">
                      {order.address}
                      {order.city ? `, ${order.city}` : ""}
                      {order.postalCode ? ` ${order.postalCode}` : ""}
                    </Detail>
                  )}
                  {order.occasion && (
                    <Detail label="Occasion">{order.occasion}</Detail>
                  )}
                  {order.dietaryNotes && (
                    <Detail label="Dietary notes" highlight>
                      {order.dietaryNotes}
                    </Detail>
                  )}
                  {order.notes && <Detail label="Notes">{order.notes}</Detail>}
                </dl>
              )}

              <div className="mt-6 flex flex-wrap gap-3 border-t border-blush/50 pt-5">
                <form action={setOrderStatusAction} className="flex gap-2">
                  <input type="hidden" name="id" value={order.id} />
                  <select
                    name="status"
                    defaultValue={order.status}
                    className="field w-auto py-2 text-xs"
                  >
                    {ORDER_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <SubmitButton
                    className="rounded-full border border-blush px-4 py-2 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                    pendingLabel="…"
                  >
                    Update
                  </SubmitButton>
                </form>

                <form action={setPaymentStatusAction} className="flex gap-2">
                  <input type="hidden" name="id" value={order.id} />
                  <select
                    name="paymentStatus"
                    defaultValue={order.paymentStatus}
                    className="field w-auto py-2 text-xs"
                  >
                    {PAYMENT_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <SubmitButton
                    className="rounded-full border border-blush px-4 py-2 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                    pendingLabel="…"
                  >
                    Update
                  </SubmitButton>
                </form>

                <a
                  href={`mailto:${order.email}?subject=${encodeURIComponent(
                    `Your Sweet Share order ${order.orderNumber}`,
                  )}`}
                  className="rounded-full border border-blush px-4 py-2 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                >
                  Email guest
                </a>

                {stripeReady && order.paymentStatus !== "paid" && (
                  <form action={sendPaymentLinkAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <SubmitButton
                      className="rounded-full bg-gradient-to-r from-rose to-berry px-4 py-2 text-xs text-white"
                      pendingLabel="Creating…"
                      confirm={
                        order.stripeSessionId
                          ? `Send ${order.customerName} a fresh payment link for ${formatMoney(order.totalCents)}? The previous link stops working.`
                          : undefined
                      }
                    >
                      {order.stripeSessionId
                        ? "Resend payment link"
                        : `Send payment link · ${formatMoney(order.totalCents)}`}
                    </SubmitButton>
                  </form>
                )}
              </div>

              {stripeReady &&
                order.paymentStatus !== "paid" &&
                order.totalCents >= ACH_THRESHOLD_CENTS && (
                  <p className="mt-3 text-[0.68rem] text-ink-faint">
                    Over {formatMoney(ACH_THRESHOLD_CENTS)}, so the link offers
                    bank transfer as well as card — about{" "}
                    {formatMoney(
                      Math.round(order.totalCents * 0.029) +
                        30 -
                        Math.min(500, Math.round(order.totalCents * 0.008)),
                    )}{" "}
                    cheaper for you if they use it.
                  </p>
                )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-full border px-3.5 py-1.5 text-xs capitalize transition-colors ${
        active
          ? "border-transparent bg-gradient-to-r from-rose to-berry text-white"
          : "border-blush bg-white/60 text-ink-soft hover:border-rose hover:text-berry"
      }`}
    >
      {label}
    </a>
  );
}

function Detail({
  label,
  children,
  highlight = false,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${highlight ? "bg-gold/15" : "bg-cloud/50"}`}
    >
      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-candy">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-ink-soft">{children}</dd>
    </div>
  );
}
