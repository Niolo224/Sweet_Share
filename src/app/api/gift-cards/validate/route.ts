import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { checkCard } from "@/lib/giftcards";
import { formatMoney } from "@/lib/utils";

const schema = z.object({ code: z.string().min(4).max(40) });

export async function POST(request: Request) {
  // Codes are the only guessable thing on the site, so this is the one
  // endpoint worth throttling hard.
  const limit = rateLimit(clientKey(request, "giftcard-validate"), {
    limit: 10,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
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
      { error: "Please enter your card code." },
      { status: 400 },
    );
  }

  const result = await checkCard(parsed.data.code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    code: result.code,
    balanceCents: result.balanceCents,
    message: `${formatMoney(result.balanceCents)} available on this card.`,
  });
}
