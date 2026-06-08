"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Email gate shown after the 3 free analyses are used up. Captures the email
 * (unlocking further use) then triggers a re-run of the pending analysis.
 */
export default function GateForm({
  inputText,
  onUnlocked,
}: {
  inputText: string;
  onUnlocked: () => void;
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = validEmail && consent && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          company: company.trim() || undefined,
          inputText,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Non è stato possibile sbloccare. Riprova.");
        setLoading(false);
        return;
      }
      onUnlocked();
    } catch {
      setError("Errore di rete. Riprova.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-2xl border border-line bg-surface-soft p-6 shadow-sm sm:p-7"
    >
      <h3 className="text-lg font-semibold text-navy">Continua gratuitamente</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Hai usato le 3 analisi gratuite. Lascia la tua email per continuare a usare lo strumento
        senza limiti.
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
          Acconsento al trattamento dei dati come descritto nell&apos;{" "}
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
          {loading ? "Sblocco…" : "Sblocca e continua"}
        </button>
        {error && <span className="text-sm text-ink-soft">{error}</span>}
      </div>
    </form>
  );
}
