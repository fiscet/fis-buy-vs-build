import { generateObject, generateText } from "ai";

import { getModel, getClassifierModel } from "./llm";
import { assertNoInjection } from "./guard";
import { loadKb, matchCategoryByText, type KbCategory } from "./kb";
import {
  CLASSIFY_SYSTEM,
  REPORT_SYSTEM,
  buildClassifyPrompt,
  buildReportPrompt,
  buildGenericReportPrompt,
} from "./prompts";
import { ReportSchema, type Report, type UserInput } from "./schema";

/**
 * Core runtime pipeline (one user request):
 *   input -> classify category -> read KB -> generateObject -> report
 *
 * Classification (per product decision, quality first): deterministic text match
 * first; only on a miss do we spend a cheap LLM classification call. So the happy
 * path is a single LLM call (generation); ambiguous inputs cost one extra.
 */

export class OutOfScopeError extends Error {
  constructor() {
    super("La descrizione non rientra nelle categorie supportate.");
    this.name = "OutOfScopeError";
  }
}

/** A matched KB category, or "generic" for a legitimate software/build need with
 *  no KB scheda (handled from the model's knowledge, not rejected). */
type Classification = KbCategory | "generic";

async function classifyCategory(input: UserInput): Promise<Classification> {
  const { categories } = await loadKb();

  // 1. Cheap, deterministic alias/name match — no model call when it hits.
  const direct = matchCategoryByText(categories, input.description);
  if (direct) return direct;

  // 2. Fallback: fast non-reasoning model emits a bare id, "generico", or "nessuna".
  const { text } = await generateText({
    model: getClassifierModel(),
    system: CLASSIFY_SYSTEM,
    prompt: buildClassifyPrompt(input, categories),
    maxOutputTokens: 20,
  });

  const out = text.toLowerCase();
  const matched = categories.find((c) => out.includes(c.id));
  if (matched) return matched;

  // Reject ONLY when the input clearly isn't a software/digitalization need.
  // Anything else (a real build-vs-buy question outside the 5 KB areas) is a
  // valuable lead -> handle it generically rather than turning it away.
  if (/\bnessuna\b/.test(out)) throw new OutOfScopeError();
  return "generic";
}

export interface GenerateReportResult {
  categoryId: string;
  report: Report;
}

/** Run the full pipeline and return the validated report + a category id. */
export async function generateReport(input: UserInput): Promise<GenerateReportResult> {
  // Gate: reject prompt-injection attempts before spending the costly generation.
  await assertNoInjection(input.description);

  const result = await classifyCategory(input);
  const isGeneric = result === "generic";

  const { object } = await generateObject({
    model: getModel(),
    schema: ReportSchema,
    system: REPORT_SYSTEM,
    prompt: isGeneric ? buildGenericReportPrompt(input) : buildReportPrompt(input, result),
  });

  return { categoryId: isGeneric ? "generico" : result.id, report: object };
}
