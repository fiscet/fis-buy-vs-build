"use client";

import { useState } from "react";

import type { Report } from "@/lib/schema";
import {
  BUDGET_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TIME_PRESSURE_OPTIONS,
} from "@/lib/labels";
import ReportView from "./ReportView";

const MIN_DESCRIPTION = 15;

type Status = "idle" | "loading" | "done" | "error";

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-sm">
      <span className="text-neutral-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:border-neutral-900 focus:outline-none"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function BuyVsBuild() {
  const [description, setDescription] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [budget, setBudget] = useState("");
  const [timePressure, setTimePressure] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  const tooShort = description.trim().length < MIN_DESCRIPTION;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tooShort || status === "loading") return;

    setStatus("loading");
    setErrorMsg("");
    setReport(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          teamSize: teamSize || undefined,
          budget: budget || undefined,
          timePressure: timePressure || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 422) {
          setErrorMsg(
            "La descrizione non rientra nei processi che questo strumento confronta. Prova a descrivere un processo aziendale da digitalizzare (gestionale, prenotazioni, portale clienti, e-commerce, integrazioni).",
          );
        } else {
          setErrorMsg(data?.error || "Qualcosa è andato storto. Riprova tra poco.");
        }
        setStatus("error");
        return;
      }

      setReport(data.report as Report);
      setStatus("done");
    } catch {
      setErrorMsg("Errore di rete. Controlla la connessione e riprova.");
      setStatus("error");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="text-sm text-neutral-600">
            Descrivi il processo che vuoi digitalizzare
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Es. Gestiamo le commesse e le approvazioni dei capi reparto su fogli Excel condivisi e si perde tutto. Vorrei un sistema interno per tracciare stati e responsabili."
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Quante persone lo useranno?" value={teamSize} onChange={setTeamSize} options={TEAM_SIZE_OPTIONS} />
          <Select label="Budget indicativo" value={budget} onChange={setBudget} options={BUDGET_OPTIONS} />
          <Select label="Tempistiche" value={timePressure} onChange={setTimePressure} options={TIME_PRESSURE_OPTIONS} />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={tooShort || status === "loading"}
            className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "loading" ? "Sto analizzando…" : "Confronta le due strade"}
          </button>
          {tooShort && description.length > 0 && (
            <span className="text-sm text-neutral-400">Descrivi il processo in almeno una frase.</span>
          )}
        </div>
      </form>

      {status === "error" && (
        <p className="mt-6 rounded-lg border border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-700">
          {errorMsg}
        </p>
      )}

      {status === "loading" && (
        <p className="mt-6 animate-pulse text-sm text-neutral-400">
          Sto confrontando soluzioni pronte e sviluppo su misura per il tuo caso…
        </p>
      )}

      {status === "done" && report && <ReportView report={report} />}
    </div>
  );
}
