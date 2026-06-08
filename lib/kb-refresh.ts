import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { generateObject } from "ai";
import { z } from "zod";

import { getModel } from "./llm";
import type { SearchProvider, SearchResult } from "./search";
import type { KbCategory, KnowledgeBase } from "./kb";

/**
 * Monthly KB refresh (cron only):
 *   per category: web search -> LLM synthesis -> VALIDATE -> keep or replace
 *   then bump version + write the local JSON (the cron is the KB's only writer).
 *
 * "Good data is sacred": a category is replaced only if the new data validates
 * AND is not clearly worse than what we already have. Otherwise we keep the old.
 */

const KB_PATH = path.join(process.cwd(), "data", "kb-seed.json");

// What the LLM is allowed to refresh from web sources (facts that change over
// time). Curated fields (id, name, aliases, description, tension) stay fixed.
const RefreshedSchema = z.object({
  commonSolutions: z
    .array(
      z.object({
        name: z.string(),
        type: z.enum(["saas", "onprem", "nocode"]),
        priceRange: z.string(),
        bestFor: z.string(),
        limitations: z.string(),
      }),
    )
    .min(1),
  typicalCustomCost: z.object({
    range: z.string(),
    timeline: z.string(),
    maintenanceNote: z.string(),
  }),
  whenBuildWins: z.string(),
});

type Refreshed = z.infer<typeof RefreshedSchema>;

// Full-KB shape, validated before any write so we never persist malformed data.
const CategorySchema = RefreshedSchema.extend({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()),
  description: z.string(),
  tension: z.enum(["alta", "media", "bassa"]),
  updatedAt: z.string(),
});
const KnowledgeBaseSchema = z.object({
  version: z.string(),
  lastUpdated: z.string(),
  categories: z.array(CategorySchema).min(1),
});

export interface CategoryOutcome {
  id: string;
  status: "updated" | "kept" | "error";
  note?: string;
}

function buildQuery(c: KbCategory): string {
  const year = new Date().getFullYear();
  return `${c.name}: software e soluzioni con prezzi per PMI in Italia (${year}). ${c.aliases
    .slice(0, 3)
    .join(", ")}`;
}

const SYNTH_SYSTEM = `Sei un analista di mercato software per PMI italiane. Dato un insieme di FONTI WEB recenti e i dati attuali di una categoria, produci una versione AGGIORNATA di soluzioni pronte e costi.
Regole:
- Basati SOLO sulle fonti fornite e sui dati attuali; non inventare strumenti o prezzi non supportati.
- Output in ITALIANO, conciso e concreto. priceRange con valori realistici (es. "~€20-40 per utente/mese").
- Mantieni 3-5 soluzioni rappresentative e di mercato. Se le fonti non aggiungono nulla di meglio, puoi riconfermare i dati attuali.
- typicalCustomCost: range e timeline plausibili per lo sviluppo su misura della categoria.`;

/** Synthesize an updated category from search results. Returns null if the new
 *  data fails validation or is clearly worse than the existing data. */
export async function synthesizeCategory(
  category: KbCategory,
  results: SearchResult[],
): Promise<KbCategory | null> {
  const sources = results
    .map((r, i) => `[${i + 1}] ${r.title} — ${r.url}\n${r.content}`)
    .join("\n\n")
    .slice(0, 12000);

  const current = {
    commonSolutions: category.commonSolutions,
    typicalCustomCost: category.typicalCustomCost,
    whenBuildWins: category.whenBuildWins,
  };

  const { object } = await generateObject({
    model: getModel(),
    schema: RefreshedSchema,
    system: SYNTH_SYSTEM,
    prompt: `CATEGORIA: ${category.name}\nDescrizione: ${category.description}\n\nDATI ATTUALI (riferimento):\n${JSON.stringify(current, null, 2)}\n\nFONTI WEB:\n${sources || "(nessuna fonte)"}\n\nProduci la versione aggiornata di commonSolutions, typicalCustomCost e whenBuildWins.`,
  });

  if (!isAcceptable(object, category)) return null;

  return { ...category, ...object, updatedAt: new Date().toISOString() };
}

/** Guard against empty/worse output overwriting good data. */
function isAcceptable(next: Refreshed, old: KbCategory): boolean {
  const minSolutions = Math.max(1, Math.floor(old.commonSolutions.length * 0.6));
  if (next.commonSolutions.length < minSolutions) return false;
  if (next.commonSolutions.some((s) => !s.name.trim() || !s.priceRange.trim())) return false;
  if (!next.typicalCustomCost.range.trim() || !next.typicalCustomCost.timeline.trim()) return false;
  if (!next.whenBuildWins.trim()) return false;
  return true;
}

function bumpVersion(version: string): string {
  // "0.1-seed" -> "0.2"; "0.2" -> "0.3"; fallback to date-based.
  const m = version.match(/^(\d+)\.(\d+)/);
  if (!m) return `1.0-${new Date().toISOString().slice(0, 10)}`;
  return `${m[1]}.${Number(m[2]) + 1}`;
}

async function loadKb(): Promise<KnowledgeBase> {
  return JSON.parse(await readFile(KB_PATH, "utf8")) as KnowledgeBase;
}

async function writeKb(kb: KnowledgeBase): Promise<void> {
  // Validate the WHOLE KB before persisting — never write malformed data.
  KnowledgeBaseSchema.parse(kb);
  await writeFile(KB_PATH, JSON.stringify(kb, null, 2) + "\n", "utf8");
}

export interface RefreshReport {
  version: string;
  outcomes: CategoryOutcome[];
  written: boolean;
}

/** Run the full refresh across all categories and persist if anything changed. */
export async function refreshKb(provider: SearchProvider): Promise<RefreshReport> {
  const kb = await loadKb();
  const outcomes: CategoryOutcome[] = [];
  let changed = false;

  for (const category of kb.categories) {
    try {
      const results = await provider.search(buildQuery(category), 5);
      const updated = await synthesizeCategory(category, results);
      if (updated) {
        Object.assign(category, updated);
        changed = true;
        outcomes.push({ id: category.id, status: "updated" });
      } else {
        outcomes.push({ id: category.id, status: "kept", note: "nuovi dati assenti o peggiori" });
      }
    } catch (err) {
      outcomes.push({ id: category.id, status: "error", note: String((err as Error).message).slice(0, 160) });
    }
  }

  if (changed) {
    kb.version = bumpVersion(kb.version);
    kb.lastUpdated = new Date().toISOString().slice(0, 10);
    await writeKb(kb);
  }

  return { version: kb.version, outcomes, written: changed };
}
