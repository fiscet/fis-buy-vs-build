import { NextResponse } from "next/server";

import { getSearchProvider } from "@/lib/search";
import { refreshKb } from "@/lib/kb-refresh";

/**
 * GET /api/cron/refresh-kb — KB refresh (Vercel Cron).
 * Protected by CRON_SECRET (Vercel sends "Authorization: Bearer <CRON_SECRET>").
 *
 * Default: refresh ONE category (the least-recently-updated) so each run fits
 * the Hobby 60s function limit; the daily schedule rotates through all of them.
 * `?all=1` refreshes every category (slow ~90s — local/Pro only).
 * `?category=<id>` refreshes a specific one.
 */

export const runtime = "nodejs";
export const maxDuration = 60; // Hobby cap; one category per run stays well under

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const provider = getSearchProvider();
  if (!provider) {
    return NextResponse.json({ skipped: true, reason: "EXA_API_KEY non configurata." });
  }

  const params = new URL(request.url).searchParams;
  const select =
    params.get("all") !== null ? "all" : (params.get("category") ?? "oldest");

  try {
    const report = await refreshKb(provider, select);
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    console.error("[cron/refresh-kb] failed:", err);
    return NextResponse.json(
      { error: "Refresh non riuscito.", detail: String((err as Error).message).slice(0, 200) },
      { status: 500 },
    );
  }
}
