/**
 * Showcase examples for the "Ispirati a un esempio" modal. Two per KB category,
 * in the voice of an Italian SME founder. Selecting one fills the form.
 * teamSize / budget / timePressure values match the Zod enums in schema.ts.
 */

export interface Example {
  tag: string;
  title: string;
  description: string;
  teamSize?: string;
  budget?: string;
  timePressure?: string;
}

export const EXAMPLES: Example[] = [
  // gestionale-interno
  {
    tag: "Gestionale",
    title: "Commesse e approvazioni su Excel",
    description:
      "Gestiamo commesse, stati di avanzamento e approvazioni dei capi reparto su fogli Excel condivisi: si perde tutto e nessuno sa a che punto sia una pratica. Vorrei un sistema interno per tracciare stati, scadenze e responsabili.",
    teamSize: "6-20",
    budget: "5-15k",
    timePressure: "qualche_mese",
  },
  {
    tag: "Gestionale",
    title: "Ordini e materiali di un laboratorio artigiano",
    description:
      "Ho una piccola produzione artigianale: gestisco ordini, materiali e tempi di consegna a mano, tra quaderni e fogli di calcolo. Vorrei uno strumento che tenga insieme anagrafiche clienti, stato degli ordini e disponibilità dei materiali.",
    teamSize: "2-5",
    budget: "5-15k",
    timePressure: "nessuna_fretta",
  },

  // prenotazioni-appuntamenti
  {
    tag: "Prenotazioni",
    title: "Agenda di uno studio dentistico",
    description:
      "Studio dentistico con più poltrone e più medici: vorrei far prenotare i pazienti online, con promemoria automatici e disponibilità gestite per ogni studio e per ogni professionista.",
    teamSize: "2-5",
    budget: "<5k",
    timePressure: "urgente",
  },
  {
    tag: "Prenotazioni",
    title: "Noleggio attrezzature per eventi",
    description:
      "Noleggiamo attrezzature per eventi: i clienti dovrebbero verificare la disponibilità per una certa data e prenotare evitando sovrapposizioni. Oggi gestiamo tutto tra telefonate e messaggi WhatsApp.",
    teamSize: "2-5",
    budget: "5-15k",
    timePressure: "qualche_mese",
  },

  // portale-clienti
  {
    tag: "Portale clienti",
    title: "Area riservata per uno studio di commercialisti",
    description:
      "Studio di commercialisti: vorrei un'area riservata dove i clienti scaricano documenti e fatture e vedono lo stato delle pratiche, invece di scambiarci email all'infinito.",
    teamSize: "6-20",
    budget: "5-15k",
    timePressure: "qualche_mese",
  },
  {
    tag: "Portale clienti",
    title: "Stato pratiche per un'agenzia assicurativa",
    description:
      "Agenzia assicurativa: i clienti chiamano in continuazione per sapere a che punto è un sinistro. Vorrei un portale dove seguono la pratica e caricano i documenti necessari.",
    teamSize: "2-5",
    budget: "5-15k",
    timePressure: "qualche_mese",
  },

  // ecommerce-custom
  {
    tag: "E-commerce",
    title: "Listini B2B e configuratore di prodotto",
    description:
      "Vendiamo componenti industriali: ci serve un e-commerce con listini personalizzati per cliente e un configuratore di prodotto, cose che le piattaforme standard non coprono senza forzature.",
    teamSize: "6-20",
    budget: "15-30k",
    timePressure: "qualche_mese",
  },
  {
    tag: "E-commerce",
    title: "Negozio online sincronizzato col magazzino",
    description:
      "Abbiamo un negozio online ma gli ordini li reinseriamo a mano nel gestionale di magazzino, e le giacenze non sono mai aggiornate. Vorrei che stock, ordini e prezzi fossero sincronizzati in automatico.",
    teamSize: "6-20",
    budget: "5-15k",
    timePressure: "qualche_mese",
  },

  // integrazione-sistemi
  {
    tag: "Integrazioni",
    title: "CRM e fatturazione che non si parlano",
    description:
      "Usiamo un CRM per i clienti e un altro software per la fatturazione: ogni cliente nuovo va inserito due volte. Vorrei collegarli per eliminare il doppio inserimento e gli errori.",
    teamSize: "6-20",
    budget: "5-15k",
    timePressure: "qualche_mese",
  },
  {
    tag: "Integrazioni",
    title: "Ordini multicanale in un unico flusso",
    description:
      "Riceviamo ordini da sito, marketplace ed email: vorrei raccoglierli in un unico flusso che aggiorna magazzino e spedizioni, senza copiare i dati a mano da un sistema all'altro.",
    teamSize: "20+",
    budget: "15-30k",
    timePressure: "nessuna_fretta",
  },
];
