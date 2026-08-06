/**
 * Launch readiness check.
 *
 *   npm run preflight
 *
 * Run this from your own machine, where the network can actually reach
 * Supabase, Stripe and Resend. It checks the things that fail *silently* —
 * a shop that looks perfectly healthy while no customer ever receives an
 * email, or members are billed and no boxes reach the kitchen.
 *
 * Nothing here writes or charges anything. It only reads.
 */
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

type Level = "blocker" | "warning";
type Result = { ok: boolean; detail: string; fix?: string; level: Level };

const results: { group: string; label: string; r: Result }[] = [];
let current = "";

function group(name: string) {
  current = name;
}
function check(label: string, r: Result) {
  results.push({ group: current, label, r });
}

const pass = (detail: string): Result => ({ ok: true, detail, level: "blocker" });
const fail = (detail: string, fix: string, level: Level = "blocker"): Result => ({
  ok: false,
  detail,
  fix,
  level,
});

const DEFAULTS = [
  "change-me-before-you-launch",
  "change-me-to-a-long-random-string",
];

/** The nine events the app actually handles. */
const REQUIRED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "charge.refunded",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
];

async function main() {
  // ── Secrets ───────────────────────────────────────────────
  group("The basics");

  for (const key of ["ADMIN_PASSWORD", "SESSION_SECRET"]) {
    const value = process.env[key];
    if (!value) {
      check(key, fail("not set", `Add ${key} to your environment.`));
    } else if (DEFAULTS.includes(value)) {
      check(key, fail("still the shipped default", `Anyone can guess this. Run: openssl rand -base64 32`));
    } else if (value.length < 16) {
      check(key, fail("too short", "Use at least 16 characters."));
    } else {
      check(key, pass(`set, ${value.length} characters`));
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    check("NEXT_PUBLIC_SITE_URL", fail("not set", "Set it to https://sweetshare.shop"));
  } else if (siteUrl.includes("localhost")) {
    check(
      "NEXT_PUBLIC_SITE_URL",
      fail(siteUrl, "Still localhost — Stripe will send customers back to your laptop.", "warning"),
    );
  } else {
    check("NEXT_PUBLIC_SITE_URL", pass(siteUrl));
  }

  // ── Database ──────────────────────────────────────────────
  group("Database");

  const dbUrl = process.env.DATABASE_URL ?? "";
  if (dbUrl.includes("REGION") || dbUrl.includes("PASSWORD@HOST")) {
    check("DATABASE_URL", fail("still a placeholder", "Supabase → Connect → ORMs → Prisma. Copy the pooled URI."));
  } else if (!dbUrl) {
    check("DATABASE_URL", fail("not set", "Required."));
  } else if (dbUrl.includes(":5432") && !process.env.DIRECT_URL) {
    check("DATABASE_URL", fail("using the direct port", "Serverless needs the pooled string (port 6543).", "warning"));
  } else {
    check("DATABASE_URL", pass(dbUrl.includes("6543") ? "pooled connection" : "set"));
  }

  if (!process.env.DIRECT_URL) {
    check("DIRECT_URL", fail("not set", "Migrations need the direct connection (port 5432)."));
  } else {
    check("DIRECT_URL", pass("set"));
  }

  const prisma = new PrismaClient();
  try {
    const [desserts, settings] = await Promise.all([
      prisma.dessert.count(),
      prisma.siteSetting.count(),
    ]);
    check("Connection", pass("reachable"));
    check(
      "Seeded",
      desserts > 0
        ? pass(`${desserts} desserts, ${settings} settings`)
        : fail("tables exist but are empty", "Run: npm run db:seed"),
    );
  } catch (error) {
    check(
      "Connection",
      fail(
        (error as Error).message.split("\n")[0].slice(0, 70),
        "Check DATABASE_URL. If the Supabase project is paused, open the dashboard to wake it.",
      ),
    );
  }

  // ── Email ─────────────────────────────────────────────────
  group("Email");

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL ?? "";

  if (!resendKey) {
    check("RESEND_API_KEY", fail("not set", "No customer will receive anything.", "warning"));
  } else {
    try {
      const response = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendKey}` },
      });

      if (!response.ok) {
        check("RESEND_API_KEY", fail(`rejected (HTTP ${response.status})`, "Check the key in Resend → API Keys."));
      } else {
        check("RESEND_API_KEY", pass("accepted"));

        const data = (await response.json()) as {
          data?: { name: string; status: string }[];
        };
        const domains = data.data ?? [];
        const verified = domains.filter((d) => d.status === "verified");

        // This is the one that silently ruins a launch.
        if (fromEmail.includes("resend.dev")) {
          check(
            "FROM_EMAIL",
            fail(
              "using onboarding@resend.dev",
              "That sender can ONLY email your own address. Every customer gets nothing. Verify sweetshare.shop in Resend → Domains.",
            ),
          );
        } else {
          const domain = fromEmail.split("@").pop()?.replace(">", "").trim() ?? "";
          const isVerified = verified.some((d) => domain.endsWith(d.name));
          check(
            "FROM_EMAIL",
            isVerified
              ? pass(`${domain} is verified`)
              : fail(
                  `${domain || "not set"} is not verified`,
                  `Verified domains: ${verified.map((d) => d.name).join(", ") || "none"}. Add it in Resend → Domains.`,
                ),
          );
        }
      }
    } catch (error) {
      check("RESEND_API_KEY", fail(`could not reach Resend — ${(error as Error).message.slice(0, 50)}`, "Check your connection."));
    }
  }

  if (!process.env.ORDER_NOTIFICATION_EMAIL) {
    check("ORDER_NOTIFICATION_EMAIL", fail("not set", "You will not be told about new orders.", "warning"));
  } else {
    check("ORDER_NOTIFICATION_EMAIL", pass(process.env.ORDER_NOTIFICATION_EMAIL));
  }

  // ── Stripe ────────────────────────────────────────────────
  group("Stripe");

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    check("STRIPE_SECRET_KEY", fail("not set", "No payments, gift cards or club.", "warning"));
  } else {
    const isLive = stripeKey.startsWith("sk_live_");
    check(
      "Mode",
      isLive
        ? pass("LIVE — real money")
        : fail("test mode", "Fine for now. Swap for sk_live_ before real customers.", "warning"),
    );

    const stripe = new Stripe(stripeKey);
    try {
      const account = await stripe.accounts.retrieve();
      check("Key", pass("accepted"));
      check(
        "Account activated",
        account.charges_enabled
          ? pass("charges enabled")
          : fail(
              "charges NOT enabled",
              "Finish activation in the Stripe dashboard — the orange banner. You cannot take a real payment until this clears.",
            ),
      );

      // Which webhook events are actually configured?
      const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
      const ours = endpoints.data.filter((e) => e.url.includes("/api/stripe/webhook"));

      if (ours.length === 0) {
        check(
          "Webhook endpoint",
          fail(
            "none pointing at /api/stripe/webhook",
            `Add ${siteUrl ?? "https://sweetshare.shop"}/api/stripe/webhook in Stripe → Developers → Webhooks.`,
          ),
        );
      } else {
        for (const endpoint of ours) {
          const enabled = endpoint.enabled_events;
          const all = enabled.includes("*");
          const missing = all
            ? []
            : REQUIRED_EVENTS.filter((e) => !enabled.includes(e));

          check(
            `Endpoint ${endpoint.url.replace(/^https?:\/\//, "").slice(0, 40)}`,
            missing.length === 0
              ? pass(all ? "all events" : `all ${REQUIRED_EVENTS.length} required events`)
              : fail(
                  `missing ${missing.length} event${missing.length === 1 ? "" : "s"}`,
                  `Add: ${missing.join(", ")}`,
                ),
          );
        }
      }
    } catch (error) {
      check("Key", fail((error as Error).message.slice(0, 70), "Check STRIPE_SECRET_KEY."));
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      check(
        "STRIPE_WEBHOOK_SECRET",
        fail(
          "not set",
          "Payments will succeed and NOTHING will mark itself paid. Copy the signing secret from your webhook endpoint.",
        ),
      );
    } else if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_")) {
      check("STRIPE_WEBHOOK_SECRET", fail("does not look like a signing secret", "It should start with whsec_"));
    } else {
      check("STRIPE_WEBHOOK_SECRET", pass("set"));
    }
  }

  // ── The club job ──────────────────────────────────────────
  group("The club job");

  if (!process.env.CRON_SECRET) {
    check(
      "CRON_SECRET",
      fail(
        "not set",
        "In production the job refuses to run — members get billed and no box ever reaches your kitchen.",
      ),
    );
  } else {
    check("CRON_SECRET", pass("set"));
  }

  // ── Images ────────────────────────────────────────────────
  group("Images");
  check(
    "Serving from",
    process.env.NEXT_PUBLIC_LOCAL_MEDIA === "1"
      ? pass("your own domain")
      : fail(
          "the Higgsfield CDN",
          "Run: npm run media:download, then set NEXT_PUBLIC_LOCAL_MEDIA=1",
          "warning",
        ),
  );

  await prisma.$disconnect().catch(() => {});

  // ── Report ────────────────────────────────────────────────
  const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
  const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
  const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
  const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
  const amber = (s: string) => `\x1b[33m${s}\x1b[0m`;

  console.log(`\n${bold("Sweet Share — launch readiness")}\n`);

  let lastGroup = "";
  for (const { group: g, label, r } of results) {
    if (g !== lastGroup) {
      console.log(`${dim("─".repeat(3))} ${bold(g)}`);
      lastGroup = g;
    }
    const mark = r.ok ? green("✓") : r.level === "warning" ? amber("!") : red("✗");
    console.log(`  ${mark} ${label.padEnd(30)} ${dim(r.detail)}`);
    if (!r.ok && r.fix) console.log(`      ${r.level === "warning" ? amber("→") : red("→")} ${r.fix}`);
  }

  const blockers = results.filter((x) => !x.r.ok && x.r.level === "blocker");
  const warnings = results.filter((x) => !x.r.ok && x.r.level === "warning");

  console.log("");
  if (blockers.length === 0 && warnings.length === 0) {
    console.log(green(bold("  Everything checks out. Go and sell some dessert.")));
  } else {
    if (blockers.length > 0) {
      console.log(red(bold(`  ${blockers.length} blocker${blockers.length === 1 ? "" : "s"} — do not take a real order yet.`)));
    }
    if (warnings.length > 0) {
      console.log(amber(`  ${warnings.length} warning${warnings.length === 1 ? "" : "s"} — fine to launch, worth fixing.`));
    }
  }
  console.log("");

  process.exit(blockers.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Preflight itself failed:", error);
  process.exit(1);
});
