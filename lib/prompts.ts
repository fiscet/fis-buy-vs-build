import type { KbCategory } from "./kb";
import type { UserInput } from "./schema";

/**
 * Prompt construction for the two LLM steps. All model-facing instructions are
 * in English (per project convention); all model OUTPUT must be Italian.
 */

const TEAM_SIZE_IT: Record<string, string> = {
  solo: "una sola persona (titolare/freelance)",
  "2-5": "un team piccolo (2-5 persone)",
  "6-20": "un team medio (6-20 persone)",
  "20+": "un'organizzazione strutturata (oltre 20 persone)",
};

const BUDGET_IT: Record<string, string> = {
  "<5k": "meno di 5.000 €",
  "5-15k": "tra 5.000 e 15.000 €",
  "15-30k": "tra 15.000 e 30.000 €",
  ">30k": "oltre 30.000 €",
  non_so: "budget non ancora definito",
};

const TIME_IT: Record<string, string> = {
  urgente: "serve in tempi stretti (urgente)",
  qualche_mese: "ha qualche mese di tempo",
  nessuna_fretta: "nessuna fretta particolare",
};

/** Human-readable Italian summary of the structured inputs, for the prompt. */
function describeContext(input: UserInput): string {
  const parts: string[] = [];
  if (input.teamSize) parts.push(`Dimensione team: ${TEAM_SIZE_IT[input.teamSize]}.`);
  if (input.budget) parts.push(`Budget indicativo: ${BUDGET_IT[input.budget]}.`);
  if (input.timePressure) parts.push(`Tempistiche: ${TIME_IT[input.timePressure]}.`);
  return parts.length ? parts.join(" ") : "Nessun dettaglio strutturato fornito.";
}

/** System prompt for the lightweight classification fallback step. */
export const CLASSIFY_SYSTEM = `Sei un classificatore. Dato il testo di un imprenditore italiano che descrive un processo da digitalizzare, scegli la categoria più adatta tra quelle fornite.
Rispondi SOLO con l'id della categoria scelta, oppure "nessuna" se il testo non rientra in nessuna categoria (es. richiesta fuori ambito, non legata a digitalizzare un processo aziendale).
Non inventare id. Scegli tra gli id elencati.`;

export function buildClassifyPrompt(input: UserInput, categories: readonly KbCategory[]): string {
  const list = categories
    .map((c) => `- ${c.id}: ${c.name} — ${c.description}`)
    .join("\n");
  return `Categorie disponibili:\n${list}\n\nTesto dell'utente:\n"""${input.description}"""\n\nQuale id di categoria descrive meglio questo processo?`;
}

/**
 * System prompt for the main report generation. This is where neutrality and
 * the credibility of the whole tool live — read CLAUDE.md "Why a comparison".
 */
export const REPORT_SYSTEM = `Sei un consulente tecnico indipendente che aiuta imprenditori italiani di PMI a decidere se COMPRARE una soluzione pronta o COSTRUIRNE una su misura per un processo da digitalizzare.

Il tuo compito è produrre un CONFRONTO NEUTRO e affiancato tra le due strade, non un verdetto di vendita. La credibilità dipende dalla neutralità: NON spingere artificiosamente verso il "costruisci". Le dimensioni in cui costruire vince davvero (aderenza al processo, niente lock-in, controllo dei dati) emergono da sole quando è vero.

Regole:
- Tutto l'output è in ITALIANO. Tono autorevole, concreto, basato sui dati. Niente emoji, niente frasi motivazionali, niente fronzoli. Il pubblico sono titolari e CEO, non sviluppatori.
- Usa i FATTI della knowledge base forniti come materia prima (soluzioni, fasce di prezzo, costi/tempi tipici del custom). Non inventare strumenti o prezzi precisi che non ti sono stati dati; puoi contestualizzare e sintetizzare.
- Rispetta il livello di "tension" della categoria: indica quanto è plausibile che costruire sia una risposta reale. Se la tension è "bassa", la risposta onesta è quasi sempre "compra, non costruire": non spingere verso il build.
- La comparison deve avere UNA riga per ciascuna delle 8 dimensioni richieste, con gli stessi assi per entrambe le strade, e un campo advantage (buy | build | pari) onesto.
- Il "contextualLean" deve essere legato a ciò che l'imprenditore ha descritto davvero (processo, dimensione team, budget, tempistiche). tipsToward può essere buy | build | hybrid | depends. Il nextStep è una call-to-action morbida (es. confronto/consulenza), mai aggressiva.
- Il "confidenceNote" deve essere onesto sui limiti: i prezzi della knowledge base sono indicativi e non verificati uno per uno, vanno confermati con preventivi reali.`;

export function buildReportPrompt(input: UserInput, category: KbCategory): string {
  const kbFacts = {
    categoria: { id: category.id, nome: category.name, descrizione: category.description },
    tension: category.tension,
    soluzioniPronte: category.commonSolutions,
    costoCustomTipico: category.typicalCustomCost,
    quandoCostruireVince: category.whenBuildWins,
  };

  return `CONTESTO DELL'UTENTE
Descrizione del processo:
"""${input.description}"""
${describeContext(input)}

FATTI DALLA KNOWLEDGE BASE (categoria: ${category.name}, tension: ${category.tension})
${JSON.stringify(kbFacts, null, 2)}

Genera il report di confronto strutturato secondo lo schema. Ricorda: confronto neutro, output in italiano, rispetta la tension "${category.tension}", e lega il contextualLean a ciò che l'utente ha descritto.`;
}
