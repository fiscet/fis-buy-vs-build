import { generateObject } from "ai";
import { z } from "zod";

import { getModel } from "./llm";
import {
  getCategories,
  getCategoryById,
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

  // 2. Fallback: focused LLM classification, constrained to known ids.
  const categories = getCategories();
  const idEnum = z.enum(["nessuna", ...categories.map((c) => c.id)] as [
    string,
    ...string[],
  ]);

  const { object } = await generateObject({
    model: getModel(),
    schema: z.object({ categoryId: idEnum }),
    system: CLASSIFY_SYSTEM,
    prompt: buildClassifyPrompt(input, categories),
  });

  if (object.categoryId === "nessuna") throw new OutOfScopeError();

  const category = getCategoryById(object.categoryId);
  if (!category) throw new OutOfScopeError();
  return category;
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
  });

  return { category, report: object };
}
