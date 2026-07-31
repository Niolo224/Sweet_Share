import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { sendEmail, emailShell } from "@/lib/email";
import { raiseDueBoxes, startBoxClock } from "@/lib/club";
import { awardForOrder, clawBack, progress } from "@/lib/loyalty";
import { formatMoney, formatDate } from "@/lib/utils";

/**
 * Stripe's side of the conversation.
 *
 * Three kinds of thing arrive here and are told apart by session metadata:
 *   kind: "gift_card"  — a gift card purchase to activate
 *   kind: "club"       — a subscription starting
 *   (no kind)          — an ordinary dessert order being paid
 *
 * Subscribe the endpoint to:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.async_payment_failed
 *   checkout.session.expired
 *   charge.refunded
 *   customer.subscription.updated
 *   customer.subscription.deleted
 *   invoice.paid
 *   invoice.payment_failed
 *
 * Locally:  stripe listen --forward-to localhost:3000/api/stripe/webhook
 */

// The signature is computed over the raw bytes, so the body must not be parsed.
export const dynamic = "force-dynamic";

/**
 * Where the subscription id lives on an invoice moved in API version
 * 2025-03-31. Read both shapes so this keeps working across versions.
 */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const loose = invoice as unknown as {
    subscription?: string | { id: string } | null;
    parent?: { subscription_details?: { subscription?: string | { id: string } } };
  };
  const candidate =
    loose.parent?.subscription_details?.subscription ?? loose.subscription;
  if (!candidate) return null;
  return typeof candidate === "string" ? candidate : candidate.id;
}

/** Stripe's subscription states, in our words. */
function mapSubscriptionStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    default:
      return "pending";
  }
}

async function markOrderPaid(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === "paid") return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "paid",
      status: order.status === "pending" ? "confirmed" : order.status,
    },
  });

  // Points are earned the moment the money is real, not when it is promised.
  const account = await awardForOrder(orderId);
  const loyaltyLine = account
    ? `<p style="margin-top:18px;padding:14px 16px;background:#ffe6ee;border-radius:12px;">
         You now have <strong>${account.points} points</strong> at our table.
         ${
           progress(account.points).remaining > 0
             ? `${progress(account.points).remaining} more and we send you $10 to spend.`
             : ""
         }
       </p>`
    : "";

  await sendEmail({
    to: order.email,
    subject: `Payment received — order ${order.orderNumber}`,
    html: emailShell(
      "Thank you — you're all set",
      `<p>Your payment has come through and your order is confirmed.</p>
       <p><strong>Order ${order.orderNumber}</strong><br/>
       ${order.fulfillment === "delivery" ? "Delivery" : "Collection"} on
       ${formatDate(order.requestedDate)}${order.timeWindow ? `, ${order.timeWindow}` : ""}<br/>
       Total paid: ${formatMoney(order.totalCents)}</p>
       ${loyaltyLine}
       <p>We bake on the morning of your date, never before. If anything
       changes, simply reply to this email.</p>`,
    ),
  });

  const notify = process.env.ORDER_NOTIFICATION_EMAIL;
  if (notify) {
    await sendEmail({
      to: notify,
      subject: `Paid — ${order.orderNumber} · ${formatMoney(order.totalCents)}`,
      html: emailShell(
        "An order has been paid",
        `<p><strong>${order.customerName}</strong> paid ${formatMoney(order.totalCents)}
         for order ${order.orderNumber}, due ${formatDate(order.requestedDate)}.</p>`,
      ),
    });
  }
}

async function activateGiftCard(giftCardId: string) {
  const card = await prisma.giftCard.findUnique({ where: { id: giftCardId } });
  if (!card || card.status !== "pending") return;

  await prisma.giftCard.update({
    where: { id: giftCardId },
    data: { status: "active", activatedAt: new Date() },
  });

  const codeBlock = `
    <p style="margin:24px 0;padding:20px;border:1px dashed #f9c4d4;border-radius:14px;text-align:center;">
      <span style="display:block;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#ee6f94;">Your code</span>
      <strong style="display:block;margin-top:8px;font-size:24px;letter-spacing:.12em;color:#45213a;">${card.code}</strong>
      <span style="display:block;margin-top:8px;font-size:14px;color:#6d3f5c;">${formatMoney(card.initialCents)}</span>
    </p>`;

  // The recipient gets the card itself, if we were given their address.
  if (card.recipientEmail) {
    await sendEmail({
      to: card.recipientEmail,
      replyTo: card.purchaserEmail ?? undefined,
      subject: `${card.purchaserName ?? "Someone"} sent you something sweet`,
      html: emailShell(
        card.recipientName ? `For you, ${card.recipientName}` : "A gift for you",
        `<p>${card.purchaserName ?? "Someone"} has sent you a Sweet Share gift card.</p>
         ${card.message ? `<p style="font-style:italic;">“${card.message}”</p>` : ""}
         ${codeBlock}
         <p>Enter it at checkout on any order. Everything we bake is free of
         dairy, eggs and refined sugar, so whatever you choose will be kind to
         you.</p>
         <p>It never expires, and if you spend less than the full amount the
         rest stays on the card.</p>`,
      ),
    });
  }

  if (card.purchaserEmail) {
    await sendEmail({
      to: card.purchaserEmail,
      subject: `Your gift card is on its way — ${formatMoney(card.initialCents)}`,
      html: emailShell(
        "Thank you",
        `<p>Your gift card is paid for and active.</p>
         ${
           card.recipientEmail
             ? `<p>We have emailed it straight to ${card.recipientName ?? card.recipientEmail}.</p>`
             : `<p>You asked us not to send it on, so here it is for you to pass along however you like.</p>`
         }
         ${codeBlock}
         <p>It never expires, and any unspent balance stays on the card.</p>`,
      ),
    });
  }

  const notify = process.env.ORDER_NOTIFICATION_EMAIL;
  if (notify) {
    await sendEmail({
      to: notify,
      subject: `Gift card sold — ${formatMoney(card.initialCents)}`,
      html: emailShell(
        "A gift card was purchased",
        `<p>${card.purchaserName ?? "Someone"} bought ${formatMoney(card.initialCents)}
         (code ${card.code})${card.recipientName ? ` for ${card.recipientName}` : ""}.</p>
         <p style="font-size:13px;color:#a37c93;">Remember this is deferred
         revenue, not income, until it is redeemed.</p>`,
      ),
    });
  }
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    console.error("[stripe/webhook] Stripe is not configured.");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Raw text, not JSON — the signature covers the exact bytes Stripe sent.
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    // A bad signature means it did not come from Stripe. Never trust it.
    console.error("[stripe/webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const kind = session.metadata?.kind;

        if (kind === "gift_card") {
          const giftCardId = session.metadata?.giftCardId;
          if (giftCardId && session.payment_status === "paid") {
            await activateGiftCard(giftCardId);
          }
          break;
        }

        if (kind === "club") {
          const subscriptionId = session.metadata?.subscriptionId;
          if (!subscriptionId) break;

          await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
              stripeSubscriptionId:
                typeof session.subscription === "string"
                  ? session.subscription
                  : (session.subscription?.id ?? null),
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : (session.customer?.id ?? null),
              status: "active",
              startedAt: new Date(),
            },
          });

          // Start the baking clock and raise the first box straight away,
          // rather than making a new member wait for tomorrow's job.
          await startBoxClock(subscriptionId);
          await raiseDueBoxes(subscriptionId);
          break;
        }

        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        /**
         * Bank debits complete the session while the money is still moving —
         * `completed` fires with payment_status "unpaid" and settles days
         * later via async_payment_succeeded. Marking that as paid would have
         * us baking against money that has not arrived.
         */
        if (session.payment_status === "paid") {
          await markOrderPaid(orderId);
        } else {
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: "processing" },
          });
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "unpaid" },
        });

        const notify = process.env.ORDER_NOTIFICATION_EMAIL;
        if (notify) {
          const order = await prisma.order.findUnique({ where: { id: orderId } });
          await sendEmail({
            to: notify,
            subject: `Bank payment failed — ${order?.orderNumber ?? orderId}`,
            html: emailShell(
              "A bank payment did not go through",
              `<p>The bank debit for order ${order?.orderNumber ?? orderId} failed.
               The order is back to unpaid — send a fresh payment link before
               you bake it.</p>`,
            ),
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          // The link timed out unused. Clear it so the admin sends a new one.
          await prisma.order.updateMany({
            where: { id: orderId, paymentStatus: { not: "paid" } },
            data: { stripeSessionId: null },
          });
        }

        // An abandoned gift card purchase should not leave a dangling code.
        const giftCardId = session.metadata?.giftCardId;
        if (giftCardId) {
          await prisma.giftCard.deleteMany({
            where: { id: giftCardId, status: "pending" },
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const refundedOrderNumber = charge.metadata?.orderNumber;
        if (refundedOrderNumber) {
          await prisma.order.updateMany({
            where: { orderNumber: refundedOrderNumber },
            data: { paymentStatus: "refunded" },
          });
          // Points followed the money in; they follow it back out.
          const refunded = await prisma.order.findUnique({
            where: { orderNumber: refundedOrderNumber },
          });
          if (refunded) await clawBack(refunded.id);
        }

        // A refunded gift card must stop being spendable.
        const giftCardId = charge.metadata?.giftCardId;
        if (giftCardId) {
          await prisma.giftCard.updateMany({
            where: { id: giftCardId },
            data: { status: "void", balanceCents: 0 },
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const ours = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!ours) break;

        const status =
          event.type === "customer.subscription.deleted"
            ? "cancelled"
            : mapSubscriptionStatus(subscription.status);

        const periodEnd = (
          subscription as unknown as { current_period_end?: number }
        ).current_period_end;

        await prisma.subscription.update({
          where: { id: ours.id },
          data: {
            status,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
            cancelledAt:
              status === "cancelled" ? (ours.cancelledAt ?? new Date()) : null,
          },
        });
        break;
      }

      case "invoice.paid": {
        const stripeSubscriptionId = invoiceSubscriptionId(event.data.object);
        if (!stripeSubscriptionId) break;

        const ours = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId },
        });
        if (!ours) break;

        /**
         * A payment renews the right to boxes; it does not itself decide how
         * many. A monthly invoice buys one month, an annual invoice buys
         * twelve — either way the member's own clock hands them out one at a
         * time, and the daily job keeps it turning.
         */
        await prisma.subscription.update({
          where: { id: ours.id },
          data: { status: "active" },
        });
        await startBoxClock(ours.id);
        await raiseDueBoxes(ours.id);
        break;
      }

      case "invoice.payment_failed": {
        const stripeSubscriptionId = invoiceSubscriptionId(event.data.object);
        if (!stripeSubscriptionId) break;

        const ours = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId },
        });
        if (!ours) break;

        await prisma.subscription.update({
          where: { id: ours.id },
          data: { status: "past_due" },
        });

        const notify = process.env.ORDER_NOTIFICATION_EMAIL;
        if (notify) {
          await sendEmail({
            to: notify,
            replyTo: ours.email,
            subject: `Club payment failed — ${ours.customerName}`,
            html: emailShell(
              "A club payment did not go through",
              `<p>${ours.customerName} (${ours.email}) is past due on the
               ${ours.plan} plan. Stripe will retry automatically; no box has
               been raised.</p>`,
            ),
          });
        }
        break;
      }

      default:
        // Everything else is noise we have not subscribed to.
        break;
    }
  } catch (error) {
    // Returning 500 makes Stripe retry, which is what we want for a
    // transient database problem.
    console.error(`[stripe/webhook] Failed handling ${event.type}:`, error);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
