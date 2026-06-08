/**
 * Loading placeholder shown while the report is generated. A one-row skeleton of
 * the comparison table — enough to signal "the table is coming" without faking
 * content. Deterministic, no data.
 */

function Bar({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded bg-line ${className}`} />;
}

export default function ReportSkeleton() {
  return (
    <section className="mt-12" aria-busy="true" aria-label="Generazione del confronto in corso">
      <p className="animate-pulse text-sm text-ink-soft">
        Sto confrontando soluzioni pronte e sviluppo su misura per il tuo caso…
      </p>

      <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-soft text-left">
              <th className="px-4 py-3 font-medium text-ink-soft">Dimensione</th>
              <th className="px-4 py-3 font-medium text-ink-soft">Compra</th>
              <th className="px-4 py-3 font-medium text-ink-soft">Sviluppa</th>
            </tr>
          </thead>
          <tbody>
            <tr className="align-top">
              <td className="px-4 py-4">
                <Bar className="h-3.5 w-32" />
                <Bar className="mt-2 h-5 w-28 rounded-full" />
              </td>
              <td className="px-4 py-4">
                <Bar className="h-3.5 w-full" />
                <Bar className="mt-2 h-3.5 w-2/3" />
              </td>
              <td className="px-4 py-4">
                <Bar className="h-3.5 w-full" />
                <Bar className="mt-2 h-3.5 w-3/4" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
