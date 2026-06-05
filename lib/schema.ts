import { z } from "zod";

/**
 * The shape of the structured report produced by the single `generateObject`
 * call. This Zod schema is the contract: it drives the LLM output and is the
 * type the React renderer consumes. Keep it in sync with CLAUDE.md.
 *
 * All user-facing string fields are Italian copy authored by the model.
 */

export const COMPARISON_DIMENSIONS = [
  "costo_iniziale",
  "costo_ricorrente",
  "tempo_attivazione",
  "aderenza_processo",
  "scalabilita",
  "lock_in",
  "manutenzione",
  "controllo_dati",
] as const;

export const ComparisonRow = z.object({
  dimension: z.enum(COMPARISON_DIMENSIONS),
  buy: z.string(), // how the "buy" option scores on this dimension
  build: z.string(), // how the "build" option scores on this dimension
  advantage: z.enum(["buy", "build", "pari"]),
});

export const ReportSchema = z.object({
  category: z.string(),
  buyOption: z.object({
    summary: z.string(),
    representativeSolutions: z.array(
      z.object({
        name: z.string(),
        priceRange: z.string(),
        bestFor: z.string(),
        limitations: z.string(),
      }),
    ),
  }),
  buildOption: z.object({
    summary: z.string(),
    estimatedCostRange: z.string(),
    estimatedTimeline: z.string(),
    maintenanceNote: z.string(),
  }),
  // one row per dimension, same axes for both paths
  comparison: z.array(ComparisonRow),
  contextualLean: z.object({
    tipsToward: z.enum(["buy", "build", "hybrid", "depends"]),
    reasoning: z.string(), // tied to what the founder actually described
    nextStep: z.string(), // soft CTA
  }),
  confidenceNote: z.string(), // honest note on data freshness / limits
});

export type ComparisonDimension = (typeof COMPARISON_DIMENSIONS)[number];
export type ComparisonRow = z.infer<typeof ComparisonRow>;
export type Report = z.infer<typeof ReportSchema>;

/**
 * User input contract (form -> API). The free-text description is the core
 * signal; the three structured selects feed the `contextualLean` reasoning
 * (team size -> per-seat cost logic, budget -> realism of build range,
 * time pressure -> buy vs build runway). Kept deliberately small: this is a
 * lead magnet, friction kills conversion.
 */

export const TEAM_SIZES = ["solo", "2-5", "6-20", "20+"] as const;
export const BUDGET_RANGES = ["<5k", "5-15k", "15-30k", ">30k", "non_so"] as const;
export const TIME_PRESSURES = ["urgente", "qualche_mese", "nessuna_fretta"] as const;

export const InputSchema = z.object({
  description: z
    .string()
    .trim()
    .min(15, "Descrivi il processo in almeno una frase.")
    .max(2000),
  teamSize: z.enum(TEAM_SIZES).optional(),
  budget: z.enum(BUDGET_RANGES).optional(),
  timePressure: z.enum(TIME_PRESSURES).optional(),
});

export type UserInput = z.infer<typeof InputSchema>;
