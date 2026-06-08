import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import type { NextResponse } from "next/server";

/**
 * Per-browser anonymous id used for the free-use gate. Stored in an httpOnly
 * cookie. Not security-grade (clearing cookies resets it) — the gate is a soft
 * lead-capture mechanism, while abuse rate limiting keys off the IP.
 */

export const CLIENT_COOKIE = "svc_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Read the existing client id from the cookie, or mint a new one. */
export async function getClientId(): Promise<string> {
  const store = await cookies();
  return store.get(CLIENT_COOKIE)?.value ?? randomUUID();
}

/** Persist (or refresh) the client id cookie on a response. */
export function setClientCookie(res: NextResponse, id: string): void {
  res.cookies.set(CLIENT_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
}

/** Best-effort client IP for abuse rate limiting (behind Vercel's proxy). */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}
