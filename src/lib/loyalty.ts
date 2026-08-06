import { prisma } from "./prisma";
import { generateCode } from "./giftcards";
import { sendEmail, emailShell } from "./email";
import { formatMoney } from "./utils";

/**
 * The Sweet Share Table — loyalty without accounts.
 *
 * Two decisions shape all of this:
 *
 * 1. **Email is the identity.** Checkout is guest-only and works; making
 *    people register to earn points would damage a flow that is currently
 *    frictionless. Points attach to the address they already give us.
 *
 * 2. **A reward is a gift card.** Rather than invent a second balance that can
 *    be spent at checkout — with its own race conditions to get wrong — a
 *    reward mints an ordinary gift card. Redemption then runs through the path
 *    that is already built, already tested and already safe under concurrency.
 *
 * Everything is ledgered in LoyaltyEvent, so any balance can be explained.
 */

// ── The dials ───────────────────────────────────────────────
// Loyalty economics are a business decision, so they live in one obvious
// place. The defaults give roughly 5% back, which is generous for food
// without being ruinous — typical programmes run 3–5%.

/** Points earned per whole dollar actually paid. */
export const POINTS_PER_DOLLAR = 1;

/** Club members earn double — retention is worth more than the margin. */
export const CLUB_MULTIPLIER = 2;

/** Points needed for a reward, and what that reward is worth. */
export const REWARD_THRESHOLD = 200;
export const REWARD_VALUE_CENTS = 1000;

/**
 * A small thank-you for a published review. Not for writing a nice one.
 *
 * Kept deliberately low relative to the ~200 points an average order earns: a
 * review incentive that competes with buying is buying words, not goodwill.
 */
export const POINTS_PER_REVIEW = 10;

export const TIERS = [
  {
    key: "neighbour",
    name: "Neighbour",
    from: 0,
    blurb: "Everyone starts here, from the first box.",
  },
  {
    key: "friend",
    name: "Friend",
    from: 500,
    blurb: "First refusal on anything new we are testing.",
  },
  {
    key: "family",
    name: "Family",
    from: 1500,
    blurb: "Free local delivery on every order, always.",
  },
] as const;

export function tierFor(lifetimePoints: number) {
  return [...TIERS].reverse().find((t) => lifetimePoints >= t.from) ?? TIERS[0];
}

export function pointsForCents(cents: number, isClubMember = false) {
  const base = Math.floor((cents / 100) * POINTS_PER_DOLLAR);
  return isClubMember ? base * CLUB_MULTIPLIER : base;
}

/** How far off the next reward, for the encouraging line in emails. */
export function progress(points: number) {
  const remaining = Math.max(0, REWARD_THRESHOLD - (points % REWARD_THRESHOLD));
  return {
    remaining,
    percent: Math.round(((REWARD_THRESHOLD - remaining) / REWARD_THRESHOLD) * 100),
  };
}

async function accountFor(email: string, name?: string | null) {
  const normalised = email.trim().toLowerCase();
  return prisma.loyaltyAccount.upsert({
    where: { email: normalised },
    create: { email: normalised, name: name?.trim() || null },
    update: name?.trim() ? { name: name.trim() } : {},
  });
}

/**
 * Award points. Idempotent per (order, reason), so a replayed webhook cannot
 * pay someone twice.
 */
export async function award({
  email,
  name,
  points,
  reason,
  orderId,
  orderNumber,
  note,
}: {
  email: string;
  name?: string | null;
  points: number;
  reason: string;
  orderId?: string;
  orderNumber?: string;
  note?: string;
}) {
  if (points === 0) return null;

  const account = await accountFor(email, name);

  try {
    await prisma.$transaction([
      prisma.loyaltyEvent.create({
        data: {
          accountId: account.id,
          points,
          reason,
          orderId,
          orderNumber,
          note,
        },
      }),
      prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          points: { increment: points },
          // Lifetime only ever counts what was earned, never what was spent.
          ...(points > 0 ? { lifetimePoints: { increment: points } } : {}),
        },
      }),
    ]);
  } catch (error) {
    // P2002 on (orderId, reason) means we already counted this one.
    if ((error as { code?: string }).code === "P2002") return null;
    throw error;
  }

  const updated = await prisma.loyaltyAccount.findUnique({
    where: { id: account.id },
  });
  if (!updated) return null;

  // Tier is derived, but stored so the admin can sort by it.
  const tier = tierFor(updated.lifetimePoints);
  if (tier.key !== updated.tier) {
    await prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: { tier: tier.key },
    });
  }

  await maybeIssueReward(account.id);
  return updated;
}

/**
 * Turn points into a reward once the threshold is crossed.
 *
 * Deliberately automatic. Asking someone to remember to redeem is how loyalty
 * schemes end up as unclaimed liability and mild resentment; a card that
 * simply arrives is a nice surprise instead.
 */
export async function maybeIssueReward(accountId: string) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: accountId },
  });
  if (!account || account.points < REWARD_THRESHOLD) return null;

  const card = await prisma.giftCard.create({
    data: {
      code: await generateCode(),
      initialCents: REWARD_VALUE_CENTS,
      balanceCents: REWARD_VALUE_CENTS,
      recipientName: account.name,
      recipientEmail: account.email,
      message: "A thank-you from everyone at Sweet Share.",
      status: "active",
      activatedAt: new Date(),
      isComped: true,
    },
  });

  await prisma.$transaction([
    prisma.loyaltyEvent.create({
      data: {
        accountId: account.id,
        points: -REWARD_THRESHOLD,
        reason: "reward",
        giftCardId: card.id,
        note: `${formatMoney(REWARD_VALUE_CENTS)} reward issued`,
      },
    }),
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        points: { decrement: REWARD_THRESHOLD },
        rewardsIssued: { increment: 1 },
      },
    }),
  ]);

  await sendEmail({
    to: account.email,
    subject: `You have earned ${formatMoney(REWARD_VALUE_CENTS)} at Sweet Share`,
    html: emailShell(
      account.name ? `Thank you, ${account.name.split(" ")[0]}` : "Thank you",
      `<p>You have reached ${REWARD_THRESHOLD} points at our table, so here is
       ${formatMoney(REWARD_VALUE_CENTS)} to spend on whatever you like.</p>
       <p style="margin:24px 0;padding:20px;border:1px dashed #f9c4d4;border-radius:14px;text-align:center;">
         <span style="display:block;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#ee6f94;">Your reward</span>
         <strong style="display:block;margin-top:8px;font-size:24px;letter-spacing:.12em;color:#45213a;">${card.code}</strong>
         <span style="display:block;margin-top:8px;font-size:14px;color:#6d3f5c;">${formatMoney(REWARD_VALUE_CENTS)}</span>
       </p>
       <p>Enter it at checkout. It never expires, and anything you do not spend
       stays on it.</p>
       <p>Thank you for keeping us baking.</p>`,
    ),
  });

  // Somebody could cross two thresholds at once on a large order.
  await maybeIssueReward(accountId);
  return card;
}

/** Take points back when an order is refunded or cancelled. */
export async function clawBack(orderId: string) {
  const earned = await prisma.loyaltyEvent.findFirst({
    where: { orderId, reason: "order" },
    include: { account: true },
  });
  if (!earned || earned.points <= 0) return;

  const already = await prisma.loyaltyEvent.findFirst({
    where: { orderId, reason: "refund" },
  });
  if (already) return;

  /**
   * A balance can never go negative: if those points have already become a
   * reward, that card has been emailed and it is theirs. We take back what is
   * still there and no more.
   *
   * The ledger records the amount actually taken, not the amount owed — the
   * events must always sum to the balance, or the history stops being able to
   * explain it. Where the two differ, the note says so.
   */
  const available = earned.account.points;
  const deducted = Math.max(0, Math.min(earned.points, available));
  const shortfall = earned.points - deducted;

  await prisma.$transaction([
    prisma.loyaltyEvent.create({
      data: {
        accountId: earned.accountId,
        points: -deducted,
        reason: "refund",
        orderId,
        orderNumber: earned.orderNumber,
        note:
          shortfall > 0
            ? `Order cancelled — ${shortfall} of ${earned.points} points had already become a reward and were left alone`
            : "Order cancelled or refunded",
      },
    }),
    prisma.loyaltyAccount.update({
      where: { id: earned.accountId },
      data: { points: { decrement: deducted } },
    }),
  ]);
}

/** Award for a paid order, doubling it for club members. */
export async function awardForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { subscription: true },
  });
  if (!order || order.paymentStatus !== "paid") return null;

  // Points are earned on money actually paid, not on gift card value —
  // otherwise a reward would earn points that mint another reward.
  const payable = order.totalCents;
  const isClubMember = Boolean(order.subscriptionId);
  const points = pointsForCents(payable, isClubMember);
  if (points <= 0) return null;

  return award({
    email: order.email,
    name: order.customerName,
    points,
    reason: "order",
    orderId: order.id,
    orderNumber: order.orderNumber,
    note: isClubMember ? "Club member — double points" : undefined,
  });
}
