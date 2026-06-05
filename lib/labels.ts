import type { ComparisonDimension } from "./schema";

/** Italian display labels for the deterministic React renderer (never the LLM). */

export const DIMENSION_LABELS: Record<ComparisonDimension, string> = {
  costo_iniziale: "Costo iniziale",
  costo_ricorrente: "Costo ricorrente",
  tempo_attivazione: "Tempo di attivazione",
  aderenza_processo: "Aderenza al processo",
  scalabilita: "Scalabilità",
  lock_in: "Lock-in (dipendenza dal fornitore)",
  manutenzione: "Manutenzione",
  controllo_dati: "Controllo dei dati",
};

export const ADVANTAGE_LABELS: Record<"buy" | "build" | "pari", string> = {
  buy: "Compra",
  build: "Costruisci",
  pari: "Pari",
};

export const LEAN_LABELS: Record<"buy" | "build" | "hybrid" | "depends", string> = {
  buy: "Tende verso: comprare",
  build: "Tende verso: costruire",
  hybrid: "Tende verso: soluzione ibrida",
  depends: "Dipende dal contesto",
};

/** Form select options (value -> Italian label). Values match the Zod enums. */

export const TEAM_SIZE_OPTIONS: { value: string; label: string }[] = [
  { value: "solo", label: "Solo io" },
  { value: "2-5", label: "2-5 persone" },
  { value: "6-20", label: "6-20 persone" },
  { value: "20+", label: "Oltre 20 persone" },
];

export const BUDGET_OPTIONS: { value: string; label: string }[] = [
  { value: "<5k", label: "Meno di 5.000 €" },
  { value: "5-15k", label: "5.000 - 15.000 €" },
  { value: "15-30k", label: "15.000 - 30.000 €" },
  { value: ">30k", label: "Oltre 30.000 €" },
  { value: "non_so", label: "Non lo so ancora" },
];

export const TIME_PRESSURE_OPTIONS: { value: string; label: string }[] = [
  { value: "urgente", label: "Urgente" },
  { value: "qualche_mese", label: "Qualche mese di tempo" },
  { value: "nessuna_fretta", label: "Nessuna fretta" },
];
