import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { sendEmail, emailShell } from "@/lib/email";

const schema = z.object({
  name: z.string().min(1, "Please tell us your name.").max(120),
  email: z.string().email("We need an email address to reply to."),
  phone: z.string().max(40).optional().nullable(),
  topic: z
    .enum(["general", "catering", "wholesale", "press", "prayer"])
    .default("general"),
  subject: z.string().max(120).optional().nullable(),
  body: z
    .string()
    .min(10, "Please write a little more so we can help properly.")
    .max(2000),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "contact"), {
    limit: 4,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "We have your messages. Please give us a moment to reply." },
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

  try {
    await prisma.message.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        topic: data.topic,
        subject: data.subject?.trim() || null,
        body: data.body.trim(),
      },
    });

    const notify =
      process.env.ORDER_NOTIFICATION_EMAIL ?? process.env.FROM_EMAIL;
    if (notify) {
      await sendEmail({
        to: notify,
        replyTo: data.email,
        subject: `${data.topic} — ${data.subject?.trim() || `message from ${data.name}`}`,
        html: emailShell(
          `New ${data.topic} message`,
          `<p><strong>${data.name}</strong> · ${data.email}${
            data.phone ? ` · ${data.phone}` : ""
          }</p>
           <p>${data.body.replace(/\n/g, "<br/>")}</p>`,
        ),
      });
    }

    return NextResponse.json({
      message:
        data.topic === "prayer"
          ? "Thank you for trusting us with that. We will pray, and we will write back."
          : "Your message is with us.",
    });
  } catch (error) {
    console.error("[contact]", error);
    return NextResponse.json(
      { error: "We could not send that. Please try again shortly." },
      { status: 500 },
    );
  }
}
