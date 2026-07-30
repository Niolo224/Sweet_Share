import { randomInt } from "crypto";
import { prisma } from "./prisma";

/**
 * Gift cards.
 *
 * Two rules shape everything here:
 *
 *  1. A card is money. Balance changes go through a transaction with a
 *     conditional update, so two orders racing on the same code can never
 *     spend it twice.
 *  2. Every movement is logged in GiftCardRedemption, so a balance can always
 *     be explained to the person holding the card.
 */

/** No O/0, I/1/L, S/5, B/8 — these get read aloud and written down. */
const ALPHABET = "ACDEFGHJKMNPQRTUVWXY2346789";
const BLOCK = 4;
const BLOCKS = 3;

function block() {
  let out = "";
  for (let i = 0; i < BLOCK; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

/** e.g. SS-K7M2-QRDX-93FA */
export async function generateCode(): Promise<string> {
  // 27^12 ≈ 1.5e17 possibilities, but collisions are cheap to rule out.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = `SS-${Array.from({ length: BLOCKS }, block).join("-")}`;
    const clash = await prisma.giftCard.findUnique({ where: { code } });
    if (!clash) return code;
  }
  throw new Error("Could not generate an unused gift card code.");
}

/** Accepts what a human types: spaces, lower case, missing dashes. */
export function normaliseCode(input: string) {
  const bare = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = bare.startsWith("SS") ? bare.slice(2) : bare;
  const groups = body.match(/.{1,4}/g) ?? [];
  return `SS-${groups.join("-")}`;
}

export type CardCheck =
  | { ok: true; code: string; balanceCents: number; giftCardId: string }
  | { ok: false; error: string };

export async function checkCard(rawCode: string): Promise<CardCheck> {
  const code = normaliseCode(rawCode);
  const card = await prisma.giftCard.findUnique({ where: { code } });

  if (!card) return { ok: false, error: "We do not recognise that code." };
  if (card.status === "void") {
    return { ok: false, error: "That card has been cancelled. Please talk to us." };
  }
  if (card.status === "pending") {
    return {
      ok: false,
      error: "That card has not been activated yet — its payment is still clearing.",
    };
  }
  if (card.balanceCents <= 0) {
    return { ok: false, error: "That card has been fully spent." };
  }

  return {
    ok: true,
    code: card.code,
    balanceCents: card.balanceCents,
    giftCardId: card.id,
  };
}

/**
 * Spend up to `requestedCents` from a card.
 *
 * The conditional update is the important part: `balanceCents: { gte: amount }`
 * inside a transaction means a second concurrent redemption finds the balance
 * already gone and fails rather than overdrawing the card.
 */
export async function redeem(
  code: string,
  requestedCents: number,
  context: { orderId?: string; orderNumber?: string },
): Promise<
  | { ok: true; appliedCents: number; redemptionId: string }
  | { ok: false; error: string }
> {
  const normalised = normaliseCode(code);

  /**
   * Losing the conditional update means somebody else spent from this card
   * between our read and our write. That is not a failure — it just means our
   * idea of the balance is stale. Read it again and take what is actually
   * left.
   *
   * Without this, simultaneous orders on one card all read the same balance,
   * all but one lose the race, and those customers are told the card "was just
   * used elsewhere" even when there is still money on it. Postgres runs writes
   * genuinely in parallel, so this happens for real; SQLite's single writer
   * hides it.
   */
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const outcome = await prisma.$transaction(async (tx) => {
        const card = await tx.giftCard.findUnique({
          where: { code: normalised },
        });

        if (!card || card.status === "void") {
          return { state: "dead" as const, error: "That card cannot be used." };
        }
        if (card.balanceCents <= 0) {
          return { state: "dead" as const, error: "That card has been fully spent." };
        }
        if (card.status !== "active") {
          return {
            state: "dead" as const,
            error: "That card is not active yet.",
          };
        }

        const applied = Math.min(card.balanceCents, requestedCents);
        if (applied <= 0) {
          return { state: "dead" as const, error: "Nothing left to apply." };
        }

        const updated = await tx.giftCard.updateMany({
          where: { id: card.id, balanceCents: { gte: applied } },
          data: { balanceCents: { decrement: applied } },
        });

        // Stale read — try again with whatever the balance is now.
        if (updated.count === 0) return { state: "contended" as const };

        if (card.balanceCents - applied === 0) {
          await tx.giftCard.update({
            where: { id: card.id },
            data: { status: "spent" },
          });
        }

        const redemption = await tx.giftCardRedemption.create({
          data: {
            giftCardId: card.id,
            orderId: context.orderId,
            orderNumber: context.orderNumber,
            amountCents: applied,
          },
        });

        return {
          state: "done" as const,
          appliedCents: applied,
          redemptionId: redemption.id,
        };
      });

      if (outcome.state === "done") {
        return {
          ok: true,
          appliedCents: outcome.appliedCents,
          redemptionId: outcome.redemptionId,
        };
      }
      if (outcome.state === "dead") {
        return { ok: false, error: outcome.error };
      }
      // contended — loop round and re-read.
    } catch (error) {
      console.error("[giftcards/redeem]", error);
      return { ok: false, error: "We could not apply that card just now." };
    }
  }

  return {
    ok: false,
    error: "That card is busy on another order. Please try again in a moment.",
  };
}

/** Undo a redemption that was taken for an order which then failed to save. */
export async function reverseRedemption(redemptionId: string) {
  const redemption = await prisma.giftCardRedemption.findUnique({
    where: { id: redemptionId },
  });
  if (!redemption) return;

  await prisma.$transaction([
    prisma.giftCard.update({
      where: { id: redemption.giftCardId },
      data: {
        balanceCents: { increment: redemption.amountCents },
        status: "active",
      },
    }),
    prisma.giftCardRedemption.delete({ where: { id: redemptionId } }),
  ]);
}

/** Hand value back when an order that used a card is cancelled. */
export async function refundToCard(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.giftCardCode || order.giftCardCents <= 0) return;

  const card = await prisma.giftCard.findUnique({
    where: { code: order.giftCardCode },
  });
  if (!card) return;

  // Only ever reverse once, however many times an order is re-cancelled.
  const already = await prisma.giftCardRedemption.findFirst({
    where: { giftCardId: card.id, orderId, isReversal: true },
  });
  if (already) return;

  await prisma.$transaction([
    prisma.giftCard.update({
      where: { id: card.id },
      data: {
        balanceCents: { increment: order.giftCardCents },
        status: card.status === "spent" ? "active" : card.status,
      },
    }),
    prisma.giftCardRedemption.create({
      data: {
        giftCardId: card.id,
        orderId,
        orderNumber: order.orderNumber,
        amountCents: order.giftCardCents,
        isReversal: true,
      },
    }),
  ]);
}

/** The amounts offered on the gift card page. */
export const GIFT_AMOUNTS = [2500, 5000, 7500, 10000, 15000] as const;
export const MIN_GIFT_CENTS = 1000;
export const MAX_GIFT_CENTS = 50000;
