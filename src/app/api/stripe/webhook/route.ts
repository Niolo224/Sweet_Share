import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { sendEmail, emailShell } from "@/lib/email";
import { formatMoney, formatDate } from "@/lib/utils";

/**
 * Stripe's side of the conversation.
 *
 * Point a webhook endpoint at /api/stripe/webhook and subscribe to:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.async_payment_failed
 *   checkout.session.expired
 *   charge.refunded
 *
 * Locally:  stripe listen --forward-to localhost:3000/api/stripe/webhook
 */

// The signature is computed over the raw bytes, so the body must not be parsed.
export const dynamic = "force-dynamic";

async function markPaid(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.paymentStatus === "paid") return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "paid",
      // A paid order is a confirmed one. Anything further along is left alone.
      status: order.status === "pending" ? "confirmed" : order.status,
    },
  });

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
        const orderId = session.metadata?.orderId;
        if (!orderId) break;

        /**
         * Bank debits complete the session while the money is still moving —
         * `completed` fires with payment_status "unpaid" and settles days
         * later via async_payment_succeeded. Marking that as paid would have
         * us baking against money that has not arrived.
         */
        if (session.payment_status === "paid") {
          await markPaid(orderId);
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
        if (!orderId) break;
        // The link timed out unused. Clear it so the admin sends a new one.
        await prisma.order.updateMany({
          where: { id: orderId, paymentStatus: { not: "paid" } },
          data: { stripeSessionId: null },
        });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const orderNumber = charge.metadata?.orderNumber;
        if (!orderNumber) break;
        await prisma.order.updateMany({
          where: { orderNumber },
          data: { paymentStatus: "refunded" },
        });
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
