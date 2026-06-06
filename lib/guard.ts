/**
 * Prompt-injection gate (Groq Llama Prompt Guard 2). Runs BEFORE the expensive
 * generation call so manipulation attempts ("ignora le istruzioni…") are rejected
 * cheaply (~100ms). The model returns a single probability in [0,1] as the message
 * content: ~0.0005 for benign text, ~0.999 for an injection/jailbreak attempt.
 *
 * Called via direct fetch rather than the AI SDK: Prompt Guard is a sequence
 * classifier (not a generative chat model), so a plain request + float parse is
 * the most robust contract.
 *
 * This is the input-layer half of the protection story; HTTP rate limiting
 * (Upstash) lands in phase 6.
 */

const DEFAULT_GUARD_MODEL = "meta-llama/llama-prompt-guard-2-86m";
const DEFAULT_THRESHOLD = 0.8;
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export class InjectionError extends Error {
  constructor(public readonly score: number) {
    super("Richiesta bloccata: rilevato un tentativo di manipolazione del prompt.");
    this.name = "InjectionError";
  }
}

/** Throws InjectionError if the text scores above the injection threshold. */
export async function assertNoInjection(text: string): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const model = process.env.GROQ_GUARD_MODEL || DEFAULT_GUARD_MODEL;
  const threshold = Number(process.env.PROMPT_GUARD_THRESHOLD) || DEFAULT_THRESHOLD;

  let res: Response;
  try {
    res = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: text }] }),
    });
  } catch (err) {
    // Fail open: don't block legitimate users if the guard is unreachable.
    console.error("[guard] prompt-guard request error:", err);
    return;
  }

  if (!res.ok) {
    console.error("[guard] prompt-guard non-OK response:", res.status);
    return; // fail open
  }

  const data = await res.json();
  const score = parseFloat(data?.choices?.[0]?.message?.content ?? "");
  if (Number.isFinite(score) && score >= threshold) {
    throw new InjectionError(score);
  }
}
