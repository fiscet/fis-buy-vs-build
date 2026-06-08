import type { Report } from "@/lib/schema";
import { ADVANTAGE_LABELS, DIMENSION_LABELS, LEAN_LABELS } from "@/lib/labels";

/**
 * Deterministic React rendering of the structured report. No LLM here.
 * Neutral, symmetric treatment of the two paths — the table must not look like
 * it steers toward building (buy and build advantages get identical styling).
 */

function AdvantageBadge({ advantage }: { advantage: "buy" | "build" | "pari" }) {
  const styles =
    advantage === "pari"
      ? "bg-surface-soft text-ink-soft"
      : "bg-navy text-white";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {advantage === "pari" ? "Pari" : `Vantaggio: ${ADVANTAGE_LABELS[advantage]}`}
    </span>
  );
}

export default function ReportView({ report }: { report: Report }) {
  return (
    <section className="mt-12 space-y-10">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">
          Confronto per
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-navy">
          {report.category}
        </h2>
      </header>

      {/* Two-path summary cards */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-navy">Compra</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {report.buyOption.summary}
          </p>
          <ul className="mt-4 space-y-3">
            {report.buyOption.representativeSolutions.map((s, i) => (
              <li key={i} className="rounded-xl bg-surface-soft p-3 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-ink">{s.name}</span>
                  <span className="text-ink-soft">{s.priceRange}</span>
                </div>
                <p className="mt-1 text-ink-soft">
                  <span className="text-ink-soft/70">Adatto a: </span>
                  {s.bestFor}
                </p>
                <p className="mt-1 text-ink-soft">
                  <span className="text-ink-soft/70">Limiti: </span>
                  {s.limitations}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-navy">Costruisci</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {report.buildOption.summary}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-surface-soft p-3">
              <dt className="text-ink-soft/70">Costo stimato</dt>
              <dd className="font-medium text-ink">{report.buildOption.estimatedCostRange}</dd>
            </div>
            <div className="rounded-xl bg-surface-soft p-3">
              <dt className="text-ink-soft/70">Tempi stimati</dt>
              <dd className="font-medium text-ink">{report.buildOption.estimatedTimeline}</dd>
            </div>
            <div className="rounded-xl bg-surface-soft p-3">
              <dt className="text-ink-soft/70">Manutenzione</dt>
              <dd className="text-ink-soft">{report.buildOption.maintenanceNote}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Comparison table */}
      <div>
        <h3 className="text-lg font-semibold text-navy">Confronto per dimensione</h3>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-soft text-left">
                <th className="px-4 py-3 font-medium text-ink-soft">Dimensione</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Compra</th>
                <th className="px-4 py-3 font-medium text-ink-soft">Costruisci</th>
              </tr>
            </thead>
            <tbody>
              {report.comparison.map((row) => {
                const buyWins = row.advantage === "buy";
                const buildWins = row.advantage === "build";
                return (
                  <tr key={row.dimension} className="border-b border-line align-top last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{DIMENSION_LABELS[row.dimension]}</div>
                      <div className="mt-1.5">
                        <AdvantageBadge advantage={row.advantage} />
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-ink-soft ${buyWins ? "bg-teal-tint/60 text-ink" : ""}`}>
                      {row.buy}
                    </td>
                    <td className={`px-4 py-3 text-ink-soft ${buildWins ? "bg-teal-tint/60 text-ink" : ""}`}>
                      {row.build}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contextual lean */}
      <div className="rounded-2xl bg-navy p-7 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-tint">
          {LEAN_LABELS[report.contextualLean.tipsToward]}
        </p>
        <p className="mt-3 leading-relaxed text-white/90">{report.contextualLean.reasoning}</p>
        <div className="mt-5 rounded-xl bg-white/10 p-4">
          <p className="text-sm font-medium text-teal-tint">Prossimo passo</p>
          <p className="mt-1 leading-relaxed text-white/90">{report.contextualLean.nextStep}</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-ink-soft/70">{report.confidenceNote}</p>
    </section>
  );
}
