import { NextResponse } from "next/server";

import { generateReport, OutOfScopeError } from "@/lib/report";
import { InputSchema } from "@/lib/schema";

/**
 * POST /api/analyze
 * Body: { description, teamSize?, budget?, timePressure? }
 * Returns: { category, report } (report validated against ReportSchema)
 *
 * NOTE: rate limiting (Upstash, BEFORE the LLM call) and the email gate land in
 * phases 5-6. This route is the phase-3 core pipeline only.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON non valido." }, { status: 400 });
  }

  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Input non valido.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { category, report } = await generateReport(parsed.data);
    return NextResponse.json({ categoryId: category.id, report });
  } catch (err) {
    if (err instanceof OutOfScopeError) {
      return NextResponse.json({ error: err.message, outOfScope: true }, { status: 422 });
    }
    console.error("[analyze] generation failed:", err);
    return NextResponse.json(
      { error: "Generazione non riuscita. Riprova tra poco." },
      { status: 500 },
    );
  }
}
