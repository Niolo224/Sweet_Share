import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { sendEmail, emailShell } from "@/lib/email";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1, "Please tell us your name.").max(120),
  email: z.string().email("We need an email so we can send you the details."),
  guests: z.coerce.number().int().min(1).max(12).default(1),
  note: z.string().max(400).optional().nullable(),
  joinList: z.boolean().optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "rsvp"), {
    limit: 6,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "That is a lot of RSVPs. Please try again in a few minutes." },
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
  const email = data.email.trim().toLowerCase();

  try {
    const event = await prisma.event.findUnique({
      where: { id: data.eventId },
      include: { _count: { select: { rsvps: true } } },
    });

    if (!event || !event.isPublished) {
      return NextResponse.json(
        { error: "We could not find that gathering." },
        { status: 404 },
      );
    }

    const already = await prisma.eventRsvp.findUnique({
      where: { eventId_email: { eventId: event.id, email } },
    });

    if (already) {
      return NextResponse.json({
        message: "You are already on the list for this one. See you there.",
      });
    }

    if (event.capacity != null && event._count.rsvps >= event.capacity) {
      return NextResponse.json(
        {
          error:
            "This gathering is full. Join our email list and we will tell you the moment we add another.",
        },
        { status: 409 },
      );
    }

    await prisma.eventRsvp.create({
      data: {
        eventId: event.id,
        name: data.name.trim(),
        email,
        guests: data.guests,
        note: data.note?.trim() || null,
      },
    });

    if (data.joinList) {
      await prisma.subscriber.upsert({
        where: { email },
        create: { email, name: data.name.trim(), source: "event" },
        update: { unsubscribedAt: null },
      });
    }

    await sendEmail({
      to: email,
      subject: `Your seat is saved — ${event.title}`,
      html: emailShell(
        "Your seat is saved",
        `<p>We are glad you are coming.</p>
         <p><strong>${event.title}</strong><br/>
         ${formatDate(event.startsAt)}<br/>
         ${event.location}</p>
         <p>${data.guests > 1 ? `We have you down for ${data.guests} seats.` : "We have you down for one seat."}</p>
         <p>We will email the exact address a few days beforehand. If anything
         changes, simply reply to this message.</p>`,
      ),
    });

    const notify = process.env.ORDER_NOTIFICATION_EMAIL;
    if (notify) {
      await sendEmail({
        to: notify,
        replyTo: email,
        subject: `RSVP — ${data.name} for ${event.title}`,
        html: emailShell(
          "New RSVP",
          `<p><strong>${data.name}</strong> (${email}) · ${data.guests} ${
            data.guests === 1 ? "seat" : "seats"
          }</p>
           <p>${event.title} — ${formatDate(event.startsAt)}</p>
           ${data.note ? `<p><strong>Note:</strong> ${data.note}</p>` : ""}`,
        ),
      });
    }

    return NextResponse.json({
      message: "Your seat is saved. We will send the details closer to the day.",
    });
  } catch (error) {
    console.error("[rsvp]", error);
    return NextResponse.json(
      { error: "We could not save that. Please try again shortly." },
      { status: 500 },
    );
  }
}
