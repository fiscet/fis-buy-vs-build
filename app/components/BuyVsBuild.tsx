"use client";

import { useState } from "react";

import type { Report } from "@/lib/schema";
import {
  BUDGET_OPTIONS,
  TEAM_SIZE_OPTIONS,
  TIME_PRESSURE_OPTIONS,
} from "@/lib/labels";
import ReportView from "./ReportView";
import ReportSkeleton from "./ReportSkeleton";
import LeadCapture from "./LeadCapture";
import ExamplesModal from "./ExamplesModal";
import GateForm from "./GateForm";
import type { Example } from "@/lib/examples";

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
      <span className="text-ink-soft">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-neutral-900 focus:border-teal focus:outline-none"
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
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [submittedText, setSubmittedText] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const [gated, setGated] = useState(false);

  const tooShort = description.trim().length < MIN_DESCRIPTION;

  function handleSelectExample(ex: Example) {
    setDescription(ex.description);
    setTeamSize(ex.teamSize ?? "");
    setBudget(ex.budget ?? "");
    setTimePressure(ex.timePressure ?? "");
    setShowExamples(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tooShort || status === "loading") return;
    runAnalysis();
  }

  async function runAnalysis() {
    setStatus("loading");
    setErrorMsg("");
    setReport(null);
    setGated(false);

    const trimmed = description.trim();

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: trimmed,
          teamSize: teamSize || undefined,
          budget: budget || undefined,
          timePressure: timePressure || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data?.gate === "email") {
          setSubmittedText(trimmed);
          setGated(true);
          setStatus("idle");
          return;
        }
        if (res.status === 429) {
          setErrorMsg(data?.error || "Troppe richieste. Riprova tra qualche minuto.");
        } else if (res.status === 422 && data?.blocked) {
          setErrorMsg(
            "Non è stato possibile elaborare questa richiesta. Descrivi un processo aziendale reale da digitalizzare.",
          );
        } else if (res.status === 422) {
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
      setCategoryId(data.categoryId as string | undefined);
      setSubmittedText(trimmed);
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
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-soft">
              Descrivi il processo che vuoi digitalizzare
            </span>
            <button
              type="button"
              onClick={() => setShowExamples(true)}
              className="shrink-0 text-sm font-medium text-teal transition hover:text-teal-dark"
            >
              Ispirati a un esempio →
            </button>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Es. Gestiamo le commesse e le approvazioni dei capi reparto su fogli Excel condivisi e si perde tutto. Vorrei un sistema interno per tracciare stati e responsabili."
            className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-neutral-900 placeholder:text-ink-soft/60 focus:border-teal focus:outline-none"
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
            className="rounded-lg bg-teal px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "loading" ? "Sto analizzando…" : "Confronta le due strade"}
          </button>
          {tooShort && description.length > 0 && (
            <span className="text-sm text-ink-soft/60">Descrivi il processo in almeno una frase.</span>
          )}
        </div>
      </form>

      {status === "error" && (
        <p className="mt-6 rounded-lg border border-line bg-teal-tint p-4 text-sm text-ink">
          {errorMsg}
        </p>
      )}

      {status === "loading" && <ReportSkeleton />}

      {gated && <GateForm inputText={submittedText} onUnlocked={() => runAnalysis()} />}

      {status === "done" && report && (
        <>
          <ReportView report={report} />
          <LeadCapture report={report} categoryId={categoryId} inputText={submittedText} />
        </>
      )}

      <ExamplesModal
        open={showExamples}
        onClose={() => setShowExamples(false)}
        onSelect={handleSelectExample}
      />
    </div>
  );
}
