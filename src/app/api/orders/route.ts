import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { sendEmail, emailShell } from "@/lib/email";
import { formatMoney, formatDate, orderNumber } from "@/lib/utils";

const DELIVERY_FEE_CENTS = 800;
const FREE_DELIVERY_OVER_CENTS = 6000;

const schema = z.object({
  customerName: z.string().min(1, "Please tell us your name.").max(120),
  email: z.string().email("We need a working email to confirm your order."),
  phone: z.string().max(40).optional().nullable(),
  fulfillment: z.enum(["pickup", "delivery"]),
  requestedDate: z.string().min(8, "Please choose a date."),
  timeWindow: z.string().max(60).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  postalCode: z.string().max(24).optional().nullable(),
  occasion: z.string().max(120).optional().nullable(),
  notes: z.string().max(800).optional().nullable(),
  dietaryNotes: z.string().max(800).optional().nullable(),
  joinList: z.boolean().optional(),
  items: z
    .array(
      z.object({
        dessertId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your basket is empty."),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "orders"), {
    limit: 6,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please give it a minute, then try again." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 },
    );
  }

  const data = parsed.data;

  if (data.fulfillment === "delivery" && !data.address?.trim()) {
    return NextResponse.json(
      { error: "Please give us a delivery address." },
      { status: 400 },
    );
  }

  try {
    // Prices always come from the database, never from the browser.
    const desserts = await prisma.dessert.findMany({
      where: { id: { in: data.items.map((i) => i.dessertId) } },
    });

    if (desserts.length === 0) {
      return NextResponse.json(
        { error: "We could not find those desserts. Please rebuild your basket." },
        { status: 400 },
      );
    }

    const unavailable = desserts.filter((d) => !d.isAvailable);
    if (unavailable.length > 0) {
      return NextResponse.json(
        {
          error: `${unavailable.map((d) => d.name).join(" and ")} ${
            unavailable.length === 1 ? "is" : "are"
          } resting this season. Please remove ${
            unavailable.length === 1 ? "it" : "them"
          } and try again.`,
        },
        { status: 400 },
      );
    }

    const lines = data.items.flatMap((item) => {
      const dessert = desserts.find((d) => d.id === item.dessertId);
      if (!dessert) return [];
      return [
        {
          dessertId: dessert.id,
          nameSnapshot: dessert.name,
          unitPriceCents: dessert.priceCents,
          quantity: item.quantity,
          leadTimeDays: dessert.leadTimeDays,
          unitLabel: dessert.unitLabel,
        },
      ];
    });

    if (lines.length === 0) {
      return NextResponse.json(
        { error: "Your basket is empty." },
        { status: 400 },
      );
    }

    // The date must respect the longest lead time in the basket.
    const requiredLead = Math.max(...lines.map((l) => l.leadTimeDays), 1);
    const earliest = new Date();
    earliest.setHours(0, 0, 0, 0);
    earliest.setDate(earliest.getDate() + requiredLead);

    const requestedDate = new Date(`${data.requestedDate}T12:00:00`);
    if (Number.isNaN(requestedDate.getTime())) {
      return NextResponse.json(
        { error: "That date did not make sense. Please choose again." },
        { status: 400 },
      );
    }
    if (requestedDate < earliest) {
      return NextResponse.json(
        {
          error: `We need ${requiredLead} ${
            requiredLead === 1 ? "day" : "days"
          } of notice for this basket. The earliest we can manage is ${formatDate(earliest)}.`,
        },
        { status: 400 },
      );
    }

    const subtotalCents = lines.reduce(
      (sum, line) => sum + line.unitPriceCents * line.quantity,
      0,
    );
    const deliveryFeeCents =
      data.fulfillment === "delivery" && subtotalCents < FREE_DELIVERY_OVER_CENTS
        ? DELIVERY_FEE_CENTS
        : 0;
    const totalCents = subtotalCents + deliveryFeeCents;

    const email = data.email.trim().toLowerCase();
    const number = orderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber: number,
        customerName: data.customerName.trim(),
        email,
        phone: data.phone?.trim() || null,
        fulfillment: data.fulfillment,
        requestedDate,
        timeWindow: data.timeWindow?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        postalCode: data.postalCode?.trim() || null,
        occasion: data.occasion?.trim() || null,
        notes: data.notes?.trim() || null,
        dietaryNotes: data.dietaryNotes?.trim() || null,
        subtotalCents,
        deliveryFeeCents,
        totalCents,
        status: "pending",
        paymentStatus: "unpaid",
        items: {
          create: lines.map((line) => ({
            dessertId: line.dessertId,
            nameSnapshot: line.nameSnapshot,
            unitPriceCents: line.unitPriceCents,
            quantity: line.quantity,
          })),
        },
      },
    });

    if (data.joinList) {
      await prisma.subscriber.upsert({
        where: { email },
        create: {
          email,
          name: data.customerName.trim(),
          source: "checkout",
        },
        update: { unsubscribedAt: null },
      });
    }

    const itemRows = lines
      .map(
        (line) =>
          `<tr><td style="padding:6px 0;">${line.quantity} × ${line.nameSnapshot}<br/><span style="color:#a37c93;font-size:12px;">${line.unitLabel}</span></td><td style="padding:6px 0;text-align:right;white-space:nowrap;">${formatMoney(
            line.unitPriceCents * line.quantity,
          )}</td></tr>`,
      )
      .join("");

    const summary = `
      <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
      <hr style="margin:14px 0;border:none;border-top:1px solid #f9c4d4;" />
      <table style="width:100%;border-collapse:collapse;">
        <tr><td>Subtotal</td><td style="text-align:right;">${formatMoney(subtotalCents)}</td></tr>
        <tr><td>${data.fulfillment === "delivery" ? "Delivery" : "Collection"}</td><td style="text-align:right;">${
          deliveryFeeCents === 0 ? "Free" : formatMoney(deliveryFeeCents)
        }</td></tr>
        <tr><td style="padding-top:8px;font-weight:bold;">Total</td><td style="padding-top:8px;text-align:right;font-weight:bold;">${formatMoney(totalCents)}</td></tr>
      </table>`;

    await sendEmail({
      to: email,
      subject: `We have your order — ${number}`,
      html: emailShell(
        `Thank you, ${data.customerName.trim().split(" ")[0]}`,
        `<p>Your advance order is with us. Nothing is charged yet — we will read
         it over, confirm we can make it beautifully for your date, and then
         send you a secure payment link.</p>
         <p><strong>Order ${number}</strong><br/>
         ${data.fulfillment === "delivery" ? "Delivery" : "Collection"} on ${formatDate(requestedDate)}${
           data.timeWindow ? `, ${data.timeWindow}` : ""
         }</p>
         ${summary}
         ${
           data.dietaryNotes?.trim()
             ? `<p style="margin-top:16px;"><strong>Your dietary notes:</strong><br/>${data.dietaryNotes.trim()}</p>`
             : ""
         }
         <p style="margin-top:16px;">If anything here is wrong, simply reply to
         this email and we will put it right.</p>`,
      ),
    });

    const notify = process.env.ORDER_NOTIFICATION_EMAIL;
    if (notify) {
      await sendEmail({
        to: notify,
        replyTo: email,
        subject: `New order ${number} — ${formatMoney(totalCents)} for ${formatDate(requestedDate)}`,
        html: emailShell(
          `New order from ${data.customerName}`,
          `<p><strong>${data.fulfillment === "delivery" ? "Delivery" : "Collection"}</strong> on ${formatDate(requestedDate)}${
            data.timeWindow ? `, ${data.timeWindow}` : ""
          }</p>
           <p>${email}${data.phone ? ` · ${data.phone}` : ""}</p>
           ${data.address ? `<p>${data.address}, ${data.city ?? ""} ${data.postalCode ?? ""}</p>` : ""}
           ${summary}
           ${data.occasion ? `<p><strong>Occasion:</strong> ${data.occasion}</p>` : ""}
           ${data.dietaryNotes ? `<p><strong>Dietary:</strong> ${data.dietaryNotes}</p>` : ""}
           ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}`,
        ),
      });
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      message: "Order received.",
    });
  } catch (error) {
    console.error("[orders]", error);
    return NextResponse.json(
      { error: "We could not place that order. Please try again shortly." },
      { status: 500 },
    );
  }
}
