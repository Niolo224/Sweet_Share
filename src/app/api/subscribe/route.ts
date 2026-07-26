import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { sendEmail, emailShell } from "@/lib/email";

const schema = z.object({
  email: z.string().email("That does not look like an email address."),
  name: z.string().max(80).optional().nullable(),
  source: z.string().max(40).optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "subscribe"), {
    limit: 5,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "That is a lot of signups. Please try again in a minute." },
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

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name?.trim() || null;

  try {
    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing) {
      // Quietly re-subscribe anyone who had previously left.
      if (existing.unsubscribedAt) {
        await prisma.subscriber.update({
          where: { email },
          data: { unsubscribedAt: null, name: name ?? existing.name },
        });
      }
      return NextResponse.json({
        message: "You are already at the table — good to see you again.",
      });
    }

    await prisma.subscriber.create({
      data: {
        email,
        name,
        source: parsed.data.source ?? "footer",
        consent: true,
      },
    });

    await sendEmail({
      to: email,
      subject: "Welcome to the Sweet Share table",
      html: emailShell(
        name ? `Welcome, ${name}` : "Welcome to the table",
        `<p>Thank you for joining us.</p>
         <p>Once or twice a month we will send you the new menu, an invitation
         to whatever gathering is coming up, and now and then a word of
         encouragement. Never more than that.</p>
         <p>Everything we bake is free of dairy, eggs and refined sugar — made
         so that nobody at your table has to sit the dessert course out.</p>
         <p>We are glad you are here.</p>`,
      ),
    });

    return NextResponse.json({
      message: "You're on the list. Welcome in — we are glad you are here.",
    });
  } catch (error) {
    console.error("[subscribe]", error);
    return NextResponse.json(
      { error: "We could not add you just now. Please try again shortly." },
      { status: 500 },
    );
  }
}
