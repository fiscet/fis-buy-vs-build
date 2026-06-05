import { createGroq } from "@ai-sdk/groq";

/**
 * Groq model factory. We talk to Groq directly (not via a gateway): its LPU
 * inference returns the full structured report in ~3-4s, which is what makes the
 * <5s UX budget achievable. Anthropic models through OpenRouter measured 15-37s.
 *
 * The model id is configured via env (never hardcoded deep in the code) so it
 * can be swapped without a code change.
 */

const DEFAULT_MODEL = "openai/gpt-oss-120b";

// gpt-oss is a reasoning model; on Groq the default effort emits many hidden
// reasoning tokens (measured 27-33s). "low" keeps the full report at ~2.7s with
// no quality loss for this task — the difference that makes <5s achievable.
const DEFAULT_REASONING_EFFORT = "low";

let provider: ReturnType<typeof createGroq> | undefined;

function getProvider() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }
  provider ??= createGroq({ apiKey });
  return provider;
}

// Classification uses a small, fast, NON-reasoning model: it returns a single
// category id in ~150ms. Using the reasoning model here was the latency culprit
// (it rambled in hidden reasoning on ambiguous "in scope?" calls: 12-23s).
const DEFAULT_CLASSIFIER_MODEL = "llama-3.1-8b-instant";

/** The model used for the structured report generation. */
export function getModel() {
  const modelId = process.env.GROQ_MODEL || DEFAULT_MODEL;
  return getProvider()(modelId);
}

/** The fast model used only for the category-classification fallback. */
export function getClassifierModel() {
  const modelId = process.env.GROQ_CLASSIFIER_MODEL || DEFAULT_CLASSIFIER_MODEL;
  return getProvider()(modelId);
}

/** Provider options to pass to generateObject. Caps reasoning effort for speed. */
export function groqOptions() {
  return {
    groq: {
      reasoningEffort: process.env.GROQ_REASONING_EFFORT || DEFAULT_REASONING_EFFORT,
    },
  };
}
