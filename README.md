# Build vs Buy

Free lead-magnet web tool for non-technical Italian SME founders. The user describes a
business process they want to digitize; the tool returns a **neutral side-by-side comparison**
of two paths — buying an existing solution vs building a custom one — across consistent
dimensions, ending with a **contextual lean** (not a hard verdict).

It is a **lead magnet**, not a SaaS: its job is to capture qualified leads for a custom-MVP
services business. The captured lead is the only real asset — lead persistence is critical.

See [`CLAUDE.md`](./CLAUDE.md) for the full project context, architecture, and guardrails.

## Tech stack

- **Next.js 16** (App Router) — frontend + API routes
- **Vercel AI SDK 6** (`generateObject`) — the single structured LLM call
- **OpenRouter** (`@openrouter/ai-sdk-provider`) — model gateway, model chosen via env
- **Zod 4** — schema for the LLM output
- **Turso** (libSQL) — lead storage
- **Resend** — sends the full report by email
- **Upstash Redis** — rate limiting (3 free uses, then email gate)
- **Tailwind CSS 4** — styling
- Knowledge base: local JSON (`data/kb-seed.json`), read-only at runtime

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run dev                  # http://localhost:3000
```

For local development of phases 1–4 you only need `OPENROUTER_API_KEY` (and optionally
`OPENROUTER_MODEL`). Turso / Resend / Upstash keys are needed once lead capture and rate
limiting land (phases 5–6).

## Project structure

```
app/                 Next.js App Router (pages + API routes)
  layout.tsx
  page.tsx
data/
  kb-seed.json       Knowledge base (read-only at runtime; cron is its only writer)
CLAUDE.md            Full project context and guardrails
.env.example         All environment variables
```

## Build phases

1. **Scaffold** ✅ — Next.js, deps, `.env.example`, README
2. Schemas + seed KB — Zod `ReportSchema`, wire in `data/kb-seed.json`
3. Core API route — input → category match → read KB → `generateObject` → report
4. Frontend — input form + comparison table + contextual-lean block (working demo)
5. Lead capture — Turso write + Resend email + 3-use email gate
6. Rate limiting — Upstash, before the LLM call
7. Cron — monthly search per category, validation, versioned KB write
8. Deploy — Vercel, cron + env

## Hard rules

- Never use an LLM for rendering/formatting — React only.
- Never run a live web search on the user request path — KB JSON only.
- Always rate-limit **before** the LLM call.
- One LLM call per user request, maximum.
- KB JSON is read-only at runtime; the monthly cron is its only writer, and it validates
  before overwriting (good data is sacred).
- Lead writes must be durable (Turso) — never a local file.
- Respect each category's `tension`: don't lean "build" on a `bassa` category.
