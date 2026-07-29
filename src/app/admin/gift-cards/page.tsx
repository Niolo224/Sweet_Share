import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/utils";
import IssueGiftCardForm from "@/components/admin/IssueGiftCardForm";
import StatusPill from "@/components/admin/StatusPill";
import SubmitButton from "@/components/admin/SubmitButton";
import { voidGiftCardAction, restoreGiftCardAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminGiftCardsPage() {
  await requireAdmin();

  const [cards, sold, outstanding] = await Promise.all([
    prisma.giftCard.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        redemptions: { orderBy: { createdAt: "desc" }, take: 5 },
        _count: { select: { redemptions: true } },
      },
      take: 200,
    }),
    prisma.giftCard.aggregate({
      where: { status: { in: ["active", "spent"] }, isComped: false },
      _sum: { initialCents: true },
      _count: true,
    }),
    prisma.giftCard.aggregate({
      where: { status: "active" },
      _sum: { balanceCents: true },
    }),
  ]);

  const soldCents = sold._sum.initialCents ?? 0;
  const outstandingCents = outstanding._sum.balanceCents ?? 0;

  return (
    <div>
      <h1 className="text-4xl">Gift cards</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Cards bought on the site activate themselves once Stripe confirms
        payment. You can also issue one by hand.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Sold, all time" value={formatMoney(soldCents)} />
        <Stat label="Cards sold" value={sold._count} />
        <Stat
          label="Unredeemed balance"
          value={formatMoney(outstandingCents)}
          note="You owe this in dessert"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-gold/50 bg-gold/10 p-5 text-sm leading-relaxed text-plum">
        <strong>A word on the accounting.</strong> Money taken for a gift card
        is not income until the card is spent — until then it is a liability,
        and the unredeemed balance above is what you owe in dessert. Most US
        states also prohibit expiry dates and dormancy fees on gift cards, and
        some require unclaimed balances to be escheated to the state after a
        period of years. Worth ten minutes with an accountant before you sell
        many.
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="order-2 space-y-3 lg:order-1">
          {cards.length === 0 ? (
            <p className="rounded-2xl border border-blush/60 bg-white/50 p-10 text-center text-sm text-ink-faint">
              No gift cards yet.
            </p>
          ) : (
            cards.map((card) => {
              const spent = card.initialCents - card.balanceCents;
              return (
                <article
                  key={card.id}
                  className="rounded-2xl border border-blush/60 bg-white/60 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-base text-plum">
                          {card.code}
                        </span>
                        <StatusPill status={card.status} />
                        {card.isComped && <span className="badge">Comped</span>}
                      </div>
                      <p className="mt-1.5 text-xs text-ink-faint">
                        {card.purchaserName
                          ? `Bought by ${card.purchaserName}`
                          : "Issued by the kitchen"}
                        {card.recipientName ? ` for ${card.recipientName}` : ""}
                        {card.recipientEmail ? ` · ${card.recipientEmail}` : ""} ·{" "}
                        {formatDate(card.createdAt, "short")}
                      </p>
                      {card.message && (
                        <p className="mt-2 text-xs italic text-ink-soft">
                          “{card.message}”
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p
                        className="text-2xl text-berry"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {formatMoney(card.balanceCents)}
                      </p>
                      <p className="text-[0.65rem] text-ink-faint">
                        of {formatMoney(card.initialCents)}
                        {spent > 0 ? ` · ${formatMoney(spent)} spent` : ""}
                      </p>
                    </div>
                  </div>

                  {card.redemptions.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-berry">
                        {card._count.redemptions} movement
                        {card._count.redemptions === 1 ? "" : "s"}
                      </summary>
                      <ul className="mt-2 space-y-1 border-t border-blush/50 pt-2">
                        {card.redemptions.map((redemption) => (
                          <li
                            key={redemption.id}
                            className="flex justify-between text-xs text-ink-soft"
                          >
                            <span>
                              {redemption.isReversal ? "Returned from" : "Spent on"}{" "}
                              {redemption.orderNumber ?? "an order"} ·{" "}
                              {formatDate(redemption.createdAt, "short")}
                            </span>
                            <span
                              className={
                                redemption.isReversal ? "text-plum" : "text-berry"
                              }
                            >
                              {redemption.isReversal ? "+" : "−"}
                              {formatMoney(redemption.amountCents)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-blush/50 pt-4">
                    {card.status === "void" ? (
                      <form action={restoreGiftCardAction}>
                        <input type="hidden" name="id" value={card.id} />
                        <SubmitButton
                          className="rounded-full border border-blush px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                          pendingLabel="…"
                        >
                          Restore
                        </SubmitButton>
                      </form>
                    ) : (
                      <form action={voidGiftCardAction}>
                        <input type="hidden" name="id" value={card.id} />
                        <SubmitButton
                          className="rounded-full border border-berry/40 px-3.5 py-1.5 text-xs text-berry transition-colors hover:bg-berry/10"
                          pendingLabel="…"
                          confirm={`Void ${card.code}? It stops working immediately.`}
                        >
                          Void
                        </SubmitButton>
                      </form>
                    )}

                    {card.recipientEmail && (
                      <a
                        href={`mailto:${card.recipientEmail}?subject=${encodeURIComponent("Your Sweet Share gift card")}&body=${encodeURIComponent(`Your code is ${card.code} — ${formatMoney(card.balanceCents)} remaining.`)}`}
                        className="rounded-full border border-blush px-3.5 py-1.5 text-xs text-ink-soft transition-colors hover:border-berry hover:text-berry"
                      >
                        Resend code
                      </a>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="order-1 lg:order-2">
          <IssueGiftCardForm />
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
