import { getClient, DbNotConfiguredError } from "./db";

/**
 * Rate limiting + free-use gate, stored in Turso (same DB as the leads — one
 * fewer external service than a dedicated Redis). The per-request query latency
 * is negligible next to the multi-second generation.
 *
 * Two limits, enforced BEFORE any LLM call (CLAUDE.md hard rule):
 *  1. Abuse rate limit — fixed window per IP (ABUSE_LIMIT per ABUSE_WINDOW_S).
 *  2. Free-use gate — per client id: FREE_USES free analyses, then an email gate.
 *     Submitting an email "unlocks" the id.
 *
 * Fails OPEN both when Turso is unconfigured AND when it errors: a limiter outage
 * must never block legitimate users (availability > strict enforcement here).
 * The leads themselves are written separately and are never at risk from this.
 */

export const FREE_USES = 2;
const ABUSE_LIMIT = 10; // requests...
const ABUSE_WINDOW_S = 60; // ...per this many seconds, per IP

export type LimitResult = { allowed: true } | { allowed: false; reason: "rate" | "gate" };

let schemaReady: Promise<void> | undefined;

function ensureSchema(): Promise<void> {
  schemaReady ??= getClient()
    .batch(
      [
        `CREATE TABLE IF NOT EXISTS usage (
          client_id  TEXT PRIMARY KEY,
          uses       INTEGER NOT NULL DEFAULT 0,
          unlocked   INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS rate_limit (
          k            TEXT NOT NULL,
          window_start INTEGER NOT NULL,
          count        INTEGER NOT NULL DEFAULT 0,
          PRIMARY KEY (k, window_start)
        )`,
      ],
      "write",
    )
    .then(() => undefined)
    .catch((err) => {
      schemaReady = undefined; // allow retry on a later request
      throw err;
    });
  return schemaReady;
}

/** Enforce abuse + free-use limits. Fails open when Turso is off or unreachable. */
export async function checkLimits(id: string, ip: string): Promise<LimitResult> {
  let client;
  try {
    client = getClient();
  } catch (err) {
    if (err instanceof DbNotConfiguredError) return { allowed: true };
    throw err;
  }

  try {
    await ensureSchema();

    // 1. Abuse: fixed window per IP, atomic upsert returning the new count.
    const windowStart =
      Math.floor(Date.now() / 1000 / ABUSE_WINDOW_S) * ABUSE_WINDOW_S;
    const rl = await client.execute({
      sql: `INSERT INTO rate_limit (k, window_start, count) VALUES (?, ?, 1)
            ON CONFLICT (k, window_start) DO UPDATE SET count = count + 1
            RETURNING count`,
      args: [ip, windowStart],
    });
    if (Number(rl.rows[0]?.count ?? 1) > ABUSE_LIMIT) {
      return { allowed: false, reason: "rate" };
    }

    // Opportunistic cleanup of stale windows (cheap, fire-and-forget).
    if (Math.random() < 0.02) {
      void client.execute({
        sql: `DELETE FROM rate_limit WHERE window_start < ?`,
        args: [windowStart - ABUSE_WINDOW_S * 5],
      });
    }

    // 2. Free-use gate.
    const u = await client.execute({
      sql: `SELECT uses, unlocked FROM usage WHERE client_id = ?`,
      args: [id],
    });
    const row = u.rows[0];
    if (row && Number(row.unlocked) === 1) return { allowed: true };
    if ((row ? Number(row.uses) : 0) >= FREE_USES) {
      return { allowed: false, reason: "gate" };
    }
    return { allowed: true };
  } catch (err) {
    console.error("[limits] Turso unreachable, failing open:", err);
    return { allowed: true };
  }
}

/** Count a successful analysis against the free-use quota. */
export async function recordUse(id: string): Promise<void> {
  let client;
  try {
    client = getClient();
  } catch {
    return;
  }
  try {
    await ensureSchema();
    await client.execute({
      sql: `INSERT INTO usage (client_id, uses) VALUES (?, 1)
            ON CONFLICT (client_id) DO UPDATE SET uses = uses + 1, updated_at = datetime('now')`,
      args: [id],
    });
  } catch (err) {
    console.error("[limits] recordUse failed (ignored):", err);
  }
}

/** Mark a client id as unlocked (it left an email) — lifts the free-use gate. */
export async function unlock(id: string): Promise<void> {
  let client;
  try {
    client = getClient();
  } catch {
    return;
  }
  try {
    await ensureSchema();
    await client.execute({
      sql: `INSERT INTO usage (client_id, unlocked) VALUES (?, 1)
            ON CONFLICT (client_id) DO UPDATE SET unlocked = 1, updated_at = datetime('now')`,
      args: [id],
    });
  } catch (err) {
    console.error("[limits] unlock failed (ignored):", err);
  }
}
