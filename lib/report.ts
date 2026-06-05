import { generateObject, generateText } from "ai";

import { getModel, getClassifierModel, groqOptions } from "./llm";
import {
  getCategories,
  matchCategoryByText,
  type KbCategory,
} from "./kb";
import {
  CLASSIFY_SYSTEM,
  REPORT_SYSTEM,
  buildClassifyPrompt,
  buildReportPrompt,
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

async function classifyCategory(input: UserInput): Promise<KbCategory> {
  // 1. Cheap, deterministic alias/name match — no model call when it hits.
  const direct = matchCategoryByText(input.description);
  if (direct) return direct;

  // 2. Fallback: fast non-reasoning model returns a bare category id (~150ms).
  // We validate by id substring (the model reliably emits the bare id); anything
  // that doesn't contain a known id (incl. "nessuna") is treated as out of scope.
  const categories = getCategories();
  const { text } = await generateText({
    model: getClassifierModel(),
    system: CLASSIFY_SYSTEM,
    prompt: buildClassifyPrompt(input, categories),
    maxOutputTokens: 20,
  });

  const out = text.toLowerCase();
  const matched = categories.find((c) => out.includes(c.id));
  if (!matched) throw new OutOfScopeError();
  return matched;
}

export interface GenerateReportResult {
  category: KbCategory;
  report: Report;
}

/** Run the full pipeline and return the validated report + matched category. */
export async function generateReport(input: UserInput): Promise<GenerateReportResult> {
  const category = await classifyCategory(input);

  const { object } = await generateObject({
    model: getModel(),
    schema: ReportSchema,
    system: REPORT_SYSTEM,
    prompt: buildReportPrompt(input, category),
    providerOptions: groqOptions(),
  });

  return { category, report: object };
}
