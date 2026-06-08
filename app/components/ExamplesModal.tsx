"use client";

import { useEffect } from "react";

import { EXAMPLES, type Example } from "@/lib/examples";

/**
 * Showcase modal: ~10 example processes (2 per category). Picking one fills the
 * form. Accessible-ish: Esc + backdrop close, body scroll lock while open.
 */
export default function ExamplesModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (example: Example) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Esempi di processi"
        className="my-auto w-full max-w-3xl rounded-2xl border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <h2 className="text-xl font-semibold text-navy">Ispirati a un esempio</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Scegli un caso simile al tuo: compileremo il form, poi puoi modificarlo come vuoi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="rounded-lg p-1 text-ink-soft transition hover:bg-surface-soft hover:text-ink"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="grid max-h-[70vh] gap-3 overflow-y-auto p-6 sm:grid-cols-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(ex)}
              className="group flex flex-col rounded-xl border border-line bg-surface p-4 text-left transition hover:border-teal hover:bg-teal-tint/40"
            >
              <span className="inline-flex w-fit rounded-full bg-surface-soft px-2 py-0.5 text-xs font-medium text-teal-dark">
                {ex.tag}
              </span>
              <span className="mt-2 font-semibold text-ink">{ex.title}</span>
              <span className="mt-1 line-clamp-3 text-sm text-ink-soft">{ex.description}</span>
              <span className="mt-3 text-sm font-medium text-teal group-hover:text-teal-dark">
                Usa questo esempio →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
