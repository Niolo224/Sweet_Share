/**
 * A small in-memory rate limiter — enough to stop a form being hammered by a
 * bot on a single-instance deployment.
 *
 * It is deliberately simple: the counters live in the process, so they reset on
 * restart and are not shared between serverless instances. If Sweet Share ever
 * runs at scale, swap this for Upstash Redis (see INTEGRATIONS.md) — the
 * function signature is designed to stay the same.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Keep the map from growing without bound on a long-lived server.
const MAX_BUCKETS = 5000;

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 } = {},
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size > MAX_BUCKETS) {
      for (const [k, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(k);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client identity from the usual proxy headers. */
export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `${scope}:${ip}`;
}
