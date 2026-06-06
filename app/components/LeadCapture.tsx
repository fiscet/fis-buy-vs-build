"use client";

import { useState } from "react";

import type { Report } from "@/lib/schema";

/**
 * Email-capture block shown under the report. The lead is the product's real
 * asset, so the ask is soft and the full report is the reward for leaving it.
 */

type Status = "idle" | "loading" | "done" | "error";

export default function LeadCapture({
  report,
  categoryId,
  inputText,
}: {
  report: Report;
  categoryId?: string;
  inputText: string;
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validEmail || status === "loading") return;

    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          company: company.trim() || undefined,
          categoryId,
          inputText,
          report,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.error || "Invio non riuscito. Riprova tra poco.");
        setStatus("error");
        return;
      }

      setMessage(
        data.emailed
          ? "Fatto. Ti abbiamo inviato il report completo via email."
          : "Richiesta registrata. Riceverai il report a breve.",
      );
      setStatus("done");
    } catch {
      setMessage("Errore di rete. Riprova.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-10 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
        <p className="text-sm text-neutral-700">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 rounded-xl border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold">Ricevi il report completo via email</h3>
      <p className="mt-1 text-sm text-neutral-600">
        Te lo inviamo in formato leggibile, da rivedere con calma o condividere con il team.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="La tua email"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
        />
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Azienda (facoltativo)"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
        />
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={!validEmail || status === "loading"}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? "Invio…" : "Inviami il report"}
        </button>
        {status === "error" && <span className="text-sm text-neutral-500">{message}</span>}
      </div>
    </form>
  );
}
