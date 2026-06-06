import { NextResponse } from "next/server";

import { LeadSchema } from "@/lib/schema";
import { insertLead, DbNotConfiguredError } from "@/lib/db";
import { sendReportEmail, EmailNotConfiguredError } from "@/lib/email";

/**
 * POST /api/lead
 * Body: { email, company?, categoryId?, inputText, report }
 *
 * Persists the lead to Turso (critical — this is the app's only real asset),
 * then sends the full report by email (best-effort: a failed email never loses
 * a captured lead).
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

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dati non validi.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, company, categoryId, inputText, report } = parsed.data;

  // 1. Durable write FIRST — losing a lead is the worst outcome.
  try {
    await insertLead({
      email,
      company,
      category: categoryId,
      inputText,
      reportJson: JSON.stringify(report),
      source: "web",
    });
  } catch (err) {
    if (err instanceof DbNotConfiguredError) {
      return NextResponse.json(
        { error: "Invio non ancora configurato. Riprova più tardi." },
        { status: 503 },
      );
    }
    console.error("[lead] Turso write failed:", err);
    return NextResponse.json(
      { error: "Salvataggio non riuscito. Riprova tra poco." },
      { status: 500 },
    );
  }

  // 2. Email is best-effort: the lead is already safe.
  let emailed = true;
  try {
    await sendReportEmail(email, report);
  } catch (err) {
    emailed = false;
    if (!(err instanceof EmailNotConfiguredError)) {
      console.error("[lead] Resend send failed:", err);
    }
  }

  return NextResponse.json({ ok: true, emailed });
}
