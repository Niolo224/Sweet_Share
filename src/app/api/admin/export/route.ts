import { NextResponse } from "next/server";
import { isSignedIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Escape a value for CSV: quote it, and double any inner quotes. */
function cell(value: unknown) {
  if (value == null) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: Array<Record<string, unknown>>, headers: string[]) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => cell(row[header])).join(","));
  }
  return lines.join("\r\n");
}

export async function GET(request: Request) {
  if (!(await isSignedIn())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const type = new URL(request.url).searchParams.get("type") ?? "subscribers";

  let csv: string;
  let filename: string;

  if (type === "orders") {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    csv = toCsv(
      orders.map((order) => ({
        orderNumber: order.orderNumber,
        placed: order.createdAt,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        fulfillment: order.fulfillment,
        requestedDate: order.requestedDate,
        timeWindow: order.timeWindow,
        address: [order.address, order.city, order.postalCode]
          .filter(Boolean)
          .join(", "),
        items: order.items
          .map((i) => `${i.quantity}x ${i.nameSnapshot}`)
          .join(" | "),
        occasion: order.occasion,
        dietaryNotes: order.dietaryNotes,
        notes: order.notes,
        subtotal: (order.subtotalCents / 100).toFixed(2),
        delivery: (order.deliveryFeeCents / 100).toFixed(2),
        total: (order.totalCents / 100).toFixed(2),
        status: order.status,
        paymentStatus: order.paymentStatus,
      })),
      [
        "orderNumber", "placed", "customerName", "email", "phone",
        "fulfillment", "requestedDate", "timeWindow", "address", "items",
        "occasion", "dietaryNotes", "notes", "subtotal", "delivery", "total",
        "status", "paymentStatus",
      ],
    );
    filename = "sweet-share-orders.csv";
  } else {
    const subscribers = await prisma.subscriber.findMany({
      where: { unsubscribedAt: null },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv(
      subscribers.map((subscriber) => ({
        email: subscriber.email,
        name: subscriber.name,
        source: subscriber.source,
        joined: subscriber.createdAt,
      })),
      ["email", "name", "source", "joined"],
    );
    filename = "sweet-share-email-list.csv";
  }

  // The BOM keeps Excel happy with accented names.
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
