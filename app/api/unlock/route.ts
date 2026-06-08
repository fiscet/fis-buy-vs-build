import { NextResponse } from "next/server";
import { z } from "zod";

import { insertLead, DbNotConfiguredError } from "@/lib/db";
import { unlock } from "@/lib/limits";
import { getClientId, setClientCookie } from "@/lib/identity";

/**
 * POST /api/unlock — the email gate.
 * Body: { email, company?, inputText? }
 *
 * Captures the email as a lead (the asset) and unlocks the client id so the
 * free-use gate is lifted. No report exists yet at this point, so the lead is
 * stored with source "email-gate".
 */

export const runtime = "nodejs";

const GateSchema = z.object({
  email: z.email("Email non valida.").trim().toLowerCase(),
  company: z.string().trim().max(200).optional(),
  inputText: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request) {
  const id = await getClientId();
  const reply = (body: unknown, init?: ResponseInit) => {
    const res = NextResponse.json(body, init);
    setClientCookie(res, id);
    return res;
  };

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return reply({ error: "JSON non valido." }, { status: 400 });
  }

  const parsed = GateSchema.safeParse(body);
  if (!parsed.success) {
    return reply(
      { error: "Dati non validi.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, company, inputText } = parsed.data;

  // Persist the lead (the asset). Skip cleanly if Turso isn't configured (local).
  try {
    await insertLead({
      email,
      company,
      inputText: inputText ?? "",
      reportJson: JSON.stringify({ source: "email-gate" }),
      source: "email-gate",
    });
  } catch (err) {
    if (!(err instanceof DbNotConfiguredError)) {
      console.error("[unlock] Turso write failed:", err);
      return reply({ error: "Salvataggio non riuscito. Riprova tra poco." }, { status: 500 });
    }
  }

  await unlock(id);
  return reply({ ok: true });
}
