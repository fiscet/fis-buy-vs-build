"use client";

import { useState } from "react";
import Link from "next/link";

import type { Report } from "@/lib/schema";

/**
 * Email-capture block shown under the report. The lead is the product's real
 * asset, so the ask is soft and the full report is the reward for leaving it.
 * GDPR: a required consent checkbox (linking the privacy policy) gates submit.
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
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = validEmail && consent && status !== "loading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

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
          : "Richiesta registrata. L'invio email non è al momento attivo.",
      );
      setStatus("done");
    } catch {
      setMessage("Errore di rete. Riprova.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-10 rounded-2xl border border-green/30 bg-green-tint p-6">
        <p className="text-sm font-medium text-ink">{message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 rounded-2xl border border-line bg-surface-soft p-6 shadow-sm sm:p-7"
    >
      <h3 className="text-lg font-semibold text-navy">Ricevi il report completo via email</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Te lo inviamo in formato leggibile, da rivedere con calma o condividere con il team.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="La tua email"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-soft/60 focus:border-teal focus:outline-none"
        />
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Azienda (facoltativo)"
          className="rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder:text-ink-soft/60 focus:border-teal focus:outline-none"
        />
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-teal"
        />
        <span>
          Acconsento al trattamento dei dati per ricevere il report ed essere ricontattato, come
          descritto nell&apos;{" "}
          <Link href="/privacy" target="_blank" className="text-teal underline">
            informativa privacy
          </Link>
          .
        </span>
      </label>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-teal px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? "Invio…" : "Inviami il report"}
        </button>
        {status === "error" && <span className="text-sm text-ink-soft">{message}</span>}
      </div>
    </form>
  );
}
