import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/**
 * OpenRouter model factory. The model id is configured via env (never hardcoded
 * deep in the code) so it can be swapped without a code change. We enable the
 * `response-healing` plugin so cheap/fast models that occasionally emit slightly
 * malformed JSON get auto-repaired before schema validation.
 */

const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";

let provider: ReturnType<typeof createOpenRouter> | undefined;

function getProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }
  provider ??= createOpenRouter({
    apiKey,
    appName: "Build vs Buy",
  });
  return provider;
}

/** The model used for the structured generation (and classification fallback). */
export function getModel() {
  const modelId = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  return getProvider()(modelId, {
    plugins: [{ id: "response-healing" }],
  });
}
