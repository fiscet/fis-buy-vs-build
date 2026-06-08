import { NextResponse } from "next/server";

import { generateReport, OutOfScopeError } from "@/lib/report";
import { InjectionError } from "@/lib/guard";
import { InputSchema } from "@/lib/schema";
import { checkLimits, recordUse } from "@/lib/limits";
import { logUnmatched } from "@/lib/db";
import { getClientId, setClientCookie, getClientIp } from "@/lib/identity";

/**
 * POST /api/analyze
 * Body: { description, teamSize?, budget?, timePressure? }
 * Returns: { categoryId, report } (report validated against ReportSchema)
 *
 * Limits are enforced BEFORE any LLM call: IP abuse rate limit (429) and the
 * 3-free-uses email gate (403 { gate: "email" }). Then the injection guard, then
 * generation. A successful analysis is counted against the free-use quota.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

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

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return reply(
      { error: "Input non valido.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Limits BEFORE the LLM call.
  const limit = await checkLimits(id, getClientIp(request));
  if (!limit.allowed) {
    if (limit.reason === "rate") {
      return reply({ error: "Troppe richieste. Riprova tra qualche minuto." }, { status: 429 });
    }
    return reply(
      {
        error: "Hai esaurito le 2 analisi gratuite. Lascia la tua email per continuare.",
        gate: "email",
      },
      { status: 403 },
    );
  }

  try {
    const { categoryId, report } = await generateReport(parsed.data);
    await recordUse(id);
    return reply({ categoryId, report });
  } catch (err) {
    if (err instanceof InjectionError) {
      return reply({ error: err.message, blocked: true }, { status: 422 });
    }
    if (err instanceof OutOfScopeError) {
      // Record the uncovered demand (description only, no email) for roadmap.
      await logUnmatched(parsed.data.description);
      return reply({ error: err.message, outOfScope: true }, { status: 422 });
    }
    console.error("[analyze] generation failed:", err);
    return reply({ error: "Generazione non riuscita. Riprova tra poco." }, { status: 500 });
  }
}
