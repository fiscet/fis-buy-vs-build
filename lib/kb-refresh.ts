import { generateObject } from "ai";
import { z } from "zod";

import { getModel } from "./llm";
import { loadKb, saveKb } from "./kb";
import type { SearchProvider, SearchResult } from "./search";
import type { KbCategory } from "./kb";

/**
 * Monthly KB refresh (cron only):
 *   per category: web search -> LLM synthesis -> VALIDATE -> keep or replace
 *   then bump version + write the local JSON (the cron is the KB's only writer).
 *
 * "Good data is sacred": a category is replaced only if the new data validates
 * AND is not clearly worse than what we already have. Otherwise we keep the old.
 */

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

// Two queries per category to widen the candidate pool: the mainstream set and,
// separately, alternatives + premium/enterprise options (so we don't keep
// surfacing only the usual names).
function buildQueries(c: KbCategory): string[] {
  const year = new Date().getFullYear();
  const aliases = c.aliases.slice(0, 3).join(", ");
  return [
    `${c.name}: software e soluzioni con prezzi per PMI in Italia (${year}). ${aliases}`,
    `migliori alternative e soluzioni premium/enterprise per ${c.name} (mercato italiano, ${year}), confronto prezzi`,
  ];
}

const SYNTH_SYSTEM = `Sei un analista di mercato software per PMI italiane. Dato un insieme di FONTI WEB recenti e i dati attuali di una categoria, produci una versione AGGIORNATA di soluzioni pronte e costi.
Regole:
- Basati SOLO sulle fonti fornite e sui dati attuali; non inventare strumenti o prezzi non supportati.
- Output in ITALIANO, conciso e concreto. priceRange con valori realistici (es. "~€20-40 per utente/mese").
- Fornisci una GAMMA AMPIA E VARIA: 5-8 soluzioni. Mescola fasce diverse — opzioni accessibili/no-code, soluzioni di fascia media, e soluzioni PREMIUM/ENTERPRISE più costose — e includi, dove esistono, strumenti specifici per il mercato/settore italiano.
- NON limitarti ai soliti nomi generici (es. Odoo, Zapier, Make) se le fonti offrono alternative valide, più specifiche o più complete: privilegia la varietà rispetto alla ripetizione.
- commonSolutions deve contenere SOLO PRODOTTI pronti all'uso e riconoscibili (SaaS, on-prem, piattaforme no-code) che si possono acquistare/sottoscrivere. ESCLUDI CATEGORICAMENTE agenzie, software house, freelance, consulenti e "progetti su misura" — inclusi nomi propri di persone o aziende di sviluppo (es. "Gestionale personalizzato di Mario Rossi", "X su misura"): lo sviluppo custom è l'altra strada (la sintetizza typicalCustomCost), non una soluzione da comprare. Se per una categoria non trovi abbastanza prodotti reali, elencane MENO (anche solo 4) ma tutti prodotti veri.
- typicalCustomCost: UNA SOLA forbice stretta e credibile per il progetto tipico (rapporto massimo ~2x tra minimo e massimo, es. "€8.000-15.000"). Puoi citare un punto d'ingresso da ~€3.000 per i casi più semplici, ma NON elencare più bande che insieme coprono un intervallo enorme (evita cose come "€3.000-8.000 / €8.000-20.000 / €20.000-40.000"). timeline realistica e coerente.`;

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

export interface RefreshReport {
  version: string;
  outcomes: CategoryOutcome[];
  written: boolean;
}

/**
 * Refresh and persist if anything changed.
 * @param select "all" (full refresh — slow, ~90s, for local/Pro), "oldest"
 *   (single least-recently-updated category — the Hobby-friendly default, fits a
 *   60s function), or a specific category id.
 */
export async function refreshKb(
  provider: SearchProvider,
  select: "all" | "oldest" | string = "oldest",
): Promise<RefreshReport> {
  const kb = await loadKb({ fresh: true });

  let targets = kb.categories;
  if (select === "oldest") {
    const oldest = [...kb.categories].sort((a, b) =>
      a.updatedAt < b.updatedAt ? -1 : 1,
    )[0];
    targets = oldest ? [oldest] : [];
  } else if (select !== "all") {
    targets = kb.categories.filter((c) => c.id === select);
  }

  const outcomes: CategoryOutcome[] = [];
  let changed = false;

  for (const category of targets) {
    try {
      // Run both queries and merge (dedup by url) to widen the candidate pool.
      const batches = await Promise.all(
        buildQueries(category).map((q) => provider.search(q, 6)),
      );
      const seen = new Set<string>();
      const results = batches.flat().filter((r) => (seen.has(r.url) ? false : seen.add(r.url)));
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
    // Validate the WHOLE KB before persisting — never write malformed data.
    KnowledgeBaseSchema.parse(kb);
    await saveKb(kb);
  }

  return { version: kb.version, outcomes, written: changed };
}
