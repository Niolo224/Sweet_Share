import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { sendEmail, emailShell } from "@/lib/email";
import {
  tierFor,
  progress,
  REWARD_THRESHOLD,
  REWARD_VALUE_CENTS,
} from "@/lib/loyalty";
import { formatMoney, formatDate } from "@/lib/utils";

const schema = z.object({ email: z.string().email() });

/**
 * "How many points do I have?"
 *
 * The balance is emailed rather than shown on screen. Letting anyone type an
 * address and read back a stranger's spending history would be a real leak,
 * and the reply is deliberately identical whether or not the account exists —
 * so this cannot be used to test which addresses have ordered from us.
 */
export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "rewards"), {
    limit: 5,
    windowMs: 10 * 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many lookups. Please try again in a few minutes." },
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
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  // Whatever we find, the caller is told the same thing.
  const sameAnswer = {
    message:
      "If that address has a place at our table, its balance is on the way to the inbox.",
  };

  try {
    const account = await prisma.loyaltyAccount.findUnique({
      where: { email },
      include: {
        events: { orderBy: { createdAt: "desc" }, take: 8 },
      },
    });

    if (!account) return NextResponse.json(sameAnswer);

    const tier = tierFor(account.lifetimePoints);
    const { remaining } = progress(account.points);

    const history = account.events
      .map(
        (e) =>
          `<tr>
             <td style="padding:5px 0;color:#6d3f5c;">${formatDate(e.createdAt, "short")} — ${
               e.reason === "order"
                 ? `Order ${e.orderNumber ?? ""}`
                 : e.reason === "review"
                   ? "Thank you for your review"
                   : e.reason === "reward"
                     ? "Reward issued"
                     : e.reason === "refund"
                       ? "Order cancelled"
                       : "Adjustment"
             }</td>
             <td style="padding:5px 0;text-align:right;color:${e.points > 0 ? "#45213a" : "#c93f6c"};">
               ${e.points > 0 ? "+" : ""}${e.points}
             </td>
           </tr>`,
      )
      .join("");

    await sendEmail({
      to: email,
      subject: `You have ${account.points} points at Sweet Share`,
      html: emailShell(
        account.name ? `Hello, ${account.name.split(" ")[0]}` : "Your place at our table",
        `<p style="margin:20px 0;padding:20px;border:1px dashed #f9c4d4;border-radius:14px;text-align:center;">
           <span style="display:block;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#ee6f94;">Points</span>
           <strong style="display:block;margin-top:6px;font-size:34px;color:#45213a;">${account.points}</strong>
           <span style="display:block;margin-top:6px;font-size:14px;color:#6d3f5c;">${tier.name}</span>
         </p>
         ${
           remaining > 0
             ? `<p>${remaining} more ${remaining === 1 ? "point" : "points"} and we send you
                ${formatMoney(REWARD_VALUE_CENTS)} to spend, automatically.</p>`
             : `<p>You are at the threshold — your reward is on its way.</p>`
         }
         ${
           account.rewardsIssued > 0
             ? `<p>You have earned ${account.rewardsIssued} reward${account.rewardsIssued === 1 ? "" : "s"} so far. Thank you for keeping us baking.</p>`
             : ""
         }
         ${
           history
             ? `<p style="margin-top:22px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#ee6f94;">Recent</p>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">${history}</table>`
             : ""
         }
         <p style="margin-top:20px;font-size:13px;color:#a37c93;">
           Points are earned automatically whenever you order — there is nothing
           to sign up for and nothing to remember. ${REWARD_THRESHOLD} points
           becomes ${formatMoney(REWARD_VALUE_CENTS)}.
         </p>`,
      ),
    });

    return NextResponse.json(sameAnswer);
  } catch (error) {
    console.error("[rewards]", error);
    // Even the failure mode gives nothing away.
    return NextResponse.json(sameAnswer);
  }
}
