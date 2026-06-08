import { NextResponse } from "next/server";

import { getSearchProvider } from "@/lib/search";
import { refreshKb } from "@/lib/kb-refresh";

/**
 * GET /api/cron/refresh-kb — monthly KB refresh (Vercel Cron).
 * Protected by CRON_SECRET (Vercel sends "Authorization: Bearer <CRON_SECRET>").
 * Skips cleanly if no search key is configured.
 */

export const runtime = "nodejs";
export const maxDuration = 300; // synthesis across all categories

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const provider = getSearchProvider();
  if (!provider) {
    return NextResponse.json({ skipped: true, reason: "EXA_API_KEY non configurata." });
  }

  try {
    const report = await refreshKb(provider);
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    console.error("[cron/refresh-kb] failed:", err);
    return NextResponse.json(
      { error: "Refresh non riuscito.", detail: String((err as Error).message).slice(0, 200) },
      { status: 500 },
    );
  }
}
