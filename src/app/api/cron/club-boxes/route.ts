import { NextResponse } from "next/server";
import { raiseDueBoxes } from "@/lib/club";

/**
 * Raises whatever club boxes are due today.
 *
 * Vercel Cron calls this daily (see vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. Any scheduler works — cron-job.org,
 * GitHub Actions, a crontab — as long as it sends that header.
 *
 * Safe to call as often as you like: boxes are keyed per member per month on
 * a unique column, so a second run the same day raises nothing.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;

  // Without a secret configured, only allow this in development — an open
  // endpoint here would let anyone spam the kitchen with boxes.
  if (!secret) return process.env.NODE_ENV !== "production";

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  try {
    const result = await raiseDueBoxes();
    if (result.raised > 0) {
      console.info(
        `[cron/club-boxes] Raised ${result.raised} of ${result.considered} due.`,
      );
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/club-boxes]", error);
    return NextResponse.json({ error: "Job failed." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return run(request);
}

// Some schedulers only POST.
export async function POST(request: Request) {
  return run(request);
}
