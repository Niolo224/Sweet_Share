import type { Subscription } from "@prisma/client";
import { prisma } from "./prisma";
import { sendEmail, emailShell } from "./email";
import { findPlan, CLUB_LEAD_TIME_DAYS } from "./plans";
import { formatDate, orderNumber } from "./utils";

/**
 * Raising club boxes.
 *
 * Billing and baking are deliberately separate. A monthly member pays twelve
 * times and eats twelve times, so the two look identical — but an annual member
 * pays *once* and still eats twelve times. Tying box creation to `invoice.paid`
 * would give them a single box for the whole year.
 *
 * So the subscription carries its own `nextBoxAt` clock, advanced one month at
 * a time, and a daily job raises whatever is due. Payment events only decide
 * whether that clock is allowed to keep running.
 *
 * Every box is keyed `<subscriptionId>:<YYYY-MM>` on a unique column, so no
 * combination of retries, replayed webhooks and overlapping job runs can raise
 * the same month twice.
 */

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Advance exactly one calendar month, without skipping short ones.
 *
 * The obvious `setMonth(m + 1)` is wrong here. From the 30th of January it
 * asks for "30 February", which does not exist, so JavaScript rolls it forward
 * into March — and February never gets a box at all. A member who joined on
 * the 29th, 30th or 31st would quietly lose a box every year.
 *
 * So we move to the 1st first, change the month, then clamp the day to
 * whatever that month actually has. The day-of-month can drift down (a 31st
 * member settles onto the 28th after their first February) which is harmless
 * for a box baked to a four-day lead time. Missing a month is not.
 */
function addOneMonth(date: Date) {
  const day = date.getDate();
  const next = new Date(date);

  next.setDate(1);
  next.setMonth(next.getMonth() + 1);

  // Day 0 of the following month is the last day of this one.
  const daysInTargetMonth = new Date(
    next.getFullYear(),
    next.getMonth() + 1,
    0,
  ).getDate();

  next.setDate(Math.min(day, daysInTargetMonth));
  return next;
}

/** Raise at most one box for a member, if one is due. Returns true if it did. */
async function raiseOne(subscription: Subscription): Promise<boolean> {
  const due = subscription.nextBoxAt;
  if (!due || due > new Date()) return false;

  const plan = findPlan(subscription.plan);
  if (!plan) {
    console.error(`[club] Unknown plan "${subscription.plan}".`);
    return false;
  }

  const requestedDate = new Date();
  requestedDate.setDate(requestedDate.getDate() + CLUB_LEAD_TIME_DAYS);
  requestedDate.setHours(12, 0, 0, 0);

  const boxKey = `${subscription.id}:${monthKey(due)}`;
  // Annual members have already paid; the order records the box, not a charge.
  const boxValueCents =
    subscription.interval === "year"
      ? Math.round(subscription.priceCents / 12)
      : subscription.priceCents;

  try {
    await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        clubBoxKey: boxKey,
        subscriptionId: subscription.id,
        customerName: subscription.customerName,
        email: subscription.email,
        phone: subscription.phone,
        fulfillment: subscription.fulfillment,
        requestedDate,
        address: subscription.address,
        city: subscription.city,
        postalCode: subscription.postalCode,
        occasion: `Club box — ${plan.name}`,
        notes: plan.contents.join("\n"),
        dietaryNotes: subscription.dietaryNotes,
        subtotalCents: boxValueCents,
        deliveryFeeCents: 0,
        totalCents: boxValueCents,
        status: "confirmed",
        paymentStatus: "paid",
        items: {
          create: [
            {
              nameSnapshot: `${plan.name} — club box`,
              unitPriceCents: boxValueCents,
              quantity: 1,
            },
          ],
        },
      },
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    // P2002 means this month's box already exists. Still advance the clock,
    // otherwise the job would retry the same month forever.
    if (code !== "P2002") throw error;
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { nextBoxAt: addOneMonth(due) },
    });
    return false;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { nextBoxAt: addOneMonth(due) },
  });

  await sendEmail({
    to: subscription.email,
    subject: `Your ${plan.name} is being baked`,
    html: emailShell(
      `This month's box, ${subscription.customerName.split(" ")[0]}`,
      `<p>Your next box is booked into the kitchen for
       <strong>${formatDate(requestedDate)}</strong>.</p>
       <p><strong>${plan.name}</strong><br/>${plan.contents.join("<br/>")}</p>
       <p>${
         subscription.fulfillment === "delivery"
           ? "We will bring it to you."
           : "We will email you when it is ready to collect."
       }</p>
       <p style="font-size:13px;color:#a37c93;">To pause, change or cancel your
       membership, just reply to this email and we will sort it out.</p>`,
    ),
  });

  const notify = process.env.ORDER_NOTIFICATION_EMAIL;
  if (notify) {
    await sendEmail({
      to: notify,
      subject: `Club box due — ${plan.name} for ${subscription.customerName}`,
      html: emailShell(
        "A club box needs baking",
        `<p><strong>${subscription.customerName}</strong> · ${plan.name}<br/>
         Due ${formatDate(requestedDate)} ·
         ${subscription.fulfillment === "delivery" ? "Delivery" : "Collection"}</p>
         <p>${plan.contents.join("<br/>")}</p>
         ${subscription.dietaryNotes ? `<p><strong>Dietary:</strong> ${subscription.dietaryNotes}</p>` : ""}`,
      ),
    });
  }

  return true;
}

/**
 * Raise every box that is due — for one member, or for all of them.
 *
 * Deliberately at most one box per member per call. If the job has been down
 * for months, catching up happens a day at a time rather than dumping a year
 * of boxes on the kitchen at once.
 */
export async function raiseDueBoxes(subscriptionId?: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      // past_due members get no boxes until Stripe collects.
      status: "active",
      nextBoxAt: { lte: new Date() },
      ...(subscriptionId ? { id: subscriptionId } : {}),
    },
    take: 200,
  });

  let raised = 0;
  for (const subscription of subscriptions) {
    try {
      if (await raiseOne(subscription)) raised += 1;
    } catch (error) {
      // One bad member must not stop the rest of the round.
      console.error(`[club] Could not raise a box for ${subscription.id}:`, error);
    }
  }

  return { considered: subscriptions.length, raised };
}

/** Start a member's baking clock the moment their first payment lands. */
export async function startBoxClock(subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });
  if (!subscription || subscription.nextBoxAt) return;

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { nextBoxAt: new Date() },
  });
}
