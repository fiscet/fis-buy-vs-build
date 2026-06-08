import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Two limits enforced BEFORE any LLM call (CLAUDE.md hard rule):
 *  1. Abuse rate limit — keyed by IP (sliding window), protects cost/abuse.
 *  2. Free-use gate — keyed by client id: 3 free analyses, then an email gate.
 *     Submitting an email "unlocks" the id for further use.
 *
 * Degrades OPEN when Upstash isn't configured (e.g. local dev): no key -> no
 * limit, so the tool still works. The injection guard is independent of this.
 */

export const FREE_USES = 3;

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

let abuseLimiter: Ratelimit | null | undefined;

function getAbuseLimiter(): Ratelimit | null {
  if (abuseLimiter !== undefined) return abuseLimiter;
  const r = getRedis();
  abuseLimiter = r
    ? new Ratelimit({ redis: r, limiter: Ratelimit.slidingWindow(10, "60 s"), prefix: "svc:abuse" })
    : null;
  return abuseLimiter;
}

export type LimitResult = { allowed: true } | { allowed: false; reason: "rate" | "gate" };

/** Enforce abuse + free-use limits. Returns allowed:true when Upstash is off. */
export async function checkLimits(id: string, ip: string): Promise<LimitResult> {
  const r = getRedis();
  if (!r) return { allowed: true };

  const limiter = getAbuseLimiter();
  if (limiter) {
    const { success } = await limiter.limit(ip);
    if (!success) return { allowed: false, reason: "rate" };
  }

  if (await r.get(`svc:unlocked:${id}`)) return { allowed: true };

  const count = (await r.get<number>(`svc:uses:${id}`)) ?? 0;
  if (count >= FREE_USES) return { allowed: false, reason: "gate" };
  return { allowed: true };
}

/** Count a successful analysis against the free-use quota (90-day window). */
export async function recordUse(id: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const key = `svc:uses:${id}`;
  const n = await r.incr(key);
  if (n === 1) await r.expire(key, 60 * 60 * 24 * 90);
}

/** Mark a client id as unlocked (it left an email) — lifts the free-use gate. */
export async function unlock(id: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set(`svc:unlocked:${id}`, 1);
}
