import type { Report } from "@/lib/schema";
import { ADVANTAGE_LABELS, DIMENSION_LABELS, LEAN_LABELS } from "@/lib/labels";

/**
 * Deterministic React rendering of the structured report. No LLM here.
 * Neutral, symmetric treatment of the two paths — the table must not look like
 * it steers toward building.
 */

function AdvantageBadge({ advantage }: { advantage: "buy" | "build" | "pari" }) {
  const styles =
    advantage === "pari"
      ? "bg-neutral-100 text-neutral-600"
      : "bg-neutral-900 text-white";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles}`}>
      {advantage === "pari" ? "Pari" : `Vantaggio: ${ADVANTAGE_LABELS[advantage]}`}
    </span>
  );
}

export default function ReportView({ report }: { report: Report }) {
  return (
    <section className="mt-10 space-y-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-400">
          Confronto per
        </p>
        <h2 className="text-2xl font-semibold tracking-tight">{report.category}</h2>
      </header>

      {/* Two-path summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 p-5">
          <h3 className="text-lg font-semibold">Compra</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {report.buyOption.summary}
          </p>
          <ul className="mt-4 space-y-3">
            {report.buyOption.representativeSolutions.map((s, i) => (
              <li key={i} className="rounded-lg bg-neutral-50 p-3 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-neutral-500">{s.priceRange}</span>
                </div>
                <p className="mt-1 text-neutral-600">
                  <span className="text-neutral-400">Adatto a: </span>
                  {s.bestFor}
                </p>
                <p className="mt-1 text-neutral-600">
                  <span className="text-neutral-400">Limiti: </span>
                  {s.limitations}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-neutral-200 p-5">
          <h3 className="text-lg font-semibold">Costruisci</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {report.buildOption.summary}
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg bg-neutral-50 p-3">
              <dt className="text-neutral-400">Costo stimato</dt>
              <dd className="font-medium">{report.buildOption.estimatedCostRange}</dd>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <dt className="text-neutral-400">Tempi stimati</dt>
              <dd className="font-medium">{report.buildOption.estimatedTimeline}</dd>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3">
              <dt className="text-neutral-400">Manutenzione</dt>
              <dd className="text-neutral-600">{report.buildOption.maintenanceNote}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Comparison table */}
      <div>
        <h3 className="text-lg font-semibold">Confronto per dimensione</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="py-2 pr-4 font-medium text-neutral-500">Dimensione</th>
                <th className="px-4 py-2 font-medium text-neutral-500">Compra</th>
                <th className="px-4 py-2 font-medium text-neutral-500">Costruisci</th>
              </tr>
            </thead>
            <tbody>
              {report.comparison.map((row) => {
                const buyWins = row.advantage === "buy";
                const buildWins = row.advantage === "build";
                return (
                  <tr key={row.dimension} className="border-b border-neutral-100 align-top">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{DIMENSION_LABELS[row.dimension]}</div>
                      <div className="mt-1">
                        <AdvantageBadge advantage={row.advantage} />
                      </div>
                    </td>
                    <td
                      className={`px-4 py-3 text-neutral-700 ${buyWins ? "bg-neutral-50 font-medium" : ""}`}
                    >
                      {row.buy}
                    </td>
                    <td
                      className={`px-4 py-3 text-neutral-700 ${buildWins ? "bg-neutral-50 font-medium" : ""}`}
                    >
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
      <div className="rounded-xl border border-neutral-900 bg-neutral-900 p-6 text-white">
        <p className="text-sm font-medium uppercase tracking-wide text-neutral-400">
          {LEAN_LABELS[report.contextualLean.tipsToward]}
        </p>
        <p className="mt-3 leading-relaxed">{report.contextualLean.reasoning}</p>
        <div className="mt-5 rounded-lg bg-white/10 p-4">
          <p className="text-sm font-medium text-neutral-300">Prossimo passo</p>
          <p className="mt-1 leading-relaxed">{report.contextualLean.nextStep}</p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-neutral-400">{report.confidenceNote}</p>
    </section>
  );
}
