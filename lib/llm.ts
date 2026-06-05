import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";

/**
 * Two-provider split, chosen by a quality+latency bake-off (June 2026):
 *
 * - GENERATION uses OpenAI `gpt-4.1`. On a deliberately tricky case it produced
 *   the most nuanced, honest reasoning of every model tried (~14s). Open models
 *   on Groq were either too shallow (llama-4-scout) or unusable for our schema
 *   (qwen3-32b / llama-3.3-70b / Kimi don't support structured output), and
 *   gpt-oss-120b failed schema validation at high reasoning effort.
 *
 * - CLASSIFICATION uses Groq `llama-3.1-8b-instant` via generateText (~150ms,
 *   ~zero cost). Picking 1 of 5 category ids needs speed, not deep reasoning.
 *
 * Both model ids are env-driven, so swapping either is a config change.
 */

const DEFAULT_MODEL = "gpt-4.1";
const DEFAULT_CLASSIFIER_MODEL = "llama-3.1-8b-instant";

let openai: ReturnType<typeof createOpenAI> | undefined;
let groq: ReturnType<typeof createGroq> | undefined;

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  openai ??= createOpenAI({ apiKey });
  return openai;
}

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }
  groq ??= createGroq({ apiKey });
  return groq;
}

/** The model used for the structured report generation (quality-critical). */
export function getModel() {
  const modelId = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  return getOpenAI()(modelId);
}

/** The fast, cheap model used only for the category-classification fallback. */
export function getClassifierModel() {
  const modelId = process.env.GROQ_CLASSIFIER_MODEL || DEFAULT_CLASSIFIER_MODEL;
  return getGroq()(modelId);
}
