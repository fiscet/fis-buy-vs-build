import { createClient, type Client } from "@libsql/client";

/**
 * Turso (libSQL) access for lead storage. The captured lead is the only real
 * asset of this app, so writes must be durable — never a local file. The table
 * is created on first use (idempotent) so there's no separate migration step.
 */

export class DbNotConfiguredError extends Error {
  constructor() {
    super("Turso non configurato (TURSO_DATABASE_URL mancante).");
    this.name = "DbNotConfiguredError";
  }
}

let client: Client | undefined;

/** Shared libSQL client. Throws DbNotConfiguredError if Turso isn't configured. */
export function getClient(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new DbNotConfiguredError();
  client ??= createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return client;
}

let schemaReady: Promise<void> | undefined;

function ensureSchema(): Promise<void> {
  schemaReady ??= getClient()
    .execute(
      `CREATE TABLE IF NOT EXISTS leads (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        email       TEXT NOT NULL,
        company     TEXT,
        category    TEXT,
        input_text  TEXT NOT NULL,
        report_json TEXT NOT NULL,
        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
        source      TEXT
      )`,
    )
    .then(() => undefined)
    .catch((err) => {
      schemaReady = undefined; // allow retry on a later request
      throw err;
    });
  return schemaReady;
}

export interface LeadRecord {
  email: string;
  company?: string;
  category?: string;
  inputText: string;
  reportJson: string;
  source?: string;
}

/** Persist a lead. Returns the new row id. Throws if Turso is unconfigured/down. */
export async function insertLead(lead: LeadRecord): Promise<number> {
  await ensureSchema();
  const result = await getClient().execute({
    sql: `INSERT INTO leads (email, company, category, input_text, report_json, source)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      lead.email,
      lead.company ?? null,
      lead.category ?? null,
      lead.inputText,
      lead.reportJson,
      lead.source ?? null,
    ],
  });
  return Number(result.lastInsertRowid ?? 0);
}

/**
 * Log an out-of-scope request (description only, NO email — anonymous) so we can
 * see uncovered demand and prioritise new categories. Best-effort: never throws,
 * skips cleanly when Turso isn't configured.
 */
export async function logUnmatched(inputText: string): Promise<void> {
  let client: Client;
  try {
    client = getClient();
  } catch {
    return; // Turso not configured (e.g. local) — nothing to do
  }
  try {
    await client.batch(
      [
        `CREATE TABLE IF NOT EXISTS unmatched_requests (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          input_text TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        { sql: `INSERT INTO unmatched_requests (input_text) VALUES (?)`, args: [inputText] },
      ],
      "write",
    );
  } catch (err) {
    console.error("[unmatched] log failed (ignored):", err);
  }
}
