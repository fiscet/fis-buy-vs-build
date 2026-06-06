import { Resend } from "resend";

import type { Report } from "./schema";
import { ADVANTAGE_LABELS, DIMENSION_LABELS, LEAN_LABELS } from "./labels";

/**
 * Sends the full report by email via Resend. The HTML is built deterministically
 * here (no LLM) — same neutral, symmetric treatment as the on-page renderer.
 */

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Resend non configurato (RESEND_API_KEY / RESEND_FROM mancanti).");
    this.name = "EmailNotConfiguredError";
  }
}

let resend: Resend | undefined;

function getResend(): { client: Resend; from: string } {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) throw new EmailNotConfiguredError();
  resend ??= new Resend(apiKey);
  return { client: resend, from };
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function reportHtml(report: Report): string {
  const rows = report.comparison
    .map((r) => {
      const tag =
        r.advantage === "pari" ? "Pari" : `Vantaggio: ${ADVANTAGE_LABELS[r.advantage]}`;
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top">
          <strong>${esc(DIMENSION_LABELS[r.dimension])}</strong><br>
          <span style="font-size:12px;color:#666">${tag}</span>
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;color:#333">${esc(r.buy)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;vertical-align:top;color:#333">${esc(r.build)}</td>
      </tr>`;
    })
    .join("");

  const solutions = report.buyOption.representativeSolutions
    .map(
      (s) =>
        `<li style="margin-bottom:8px"><strong>${esc(s.name)}</strong> — ${esc(s.priceRange)}<br>
         <span style="color:#666">Adatto a: ${esc(s.bestFor)} · Limiti: ${esc(s.limitations)}</span></li>`,
    )
    .join("");

  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;color:#0a0a0a">
    <p style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#999;margin:0">Confronto per</p>
    <h1 style="font-size:22px;margin:4px 0 20px">${esc(report.category)}</h1>

    <h2 style="font-size:16px;margin:24px 0 8px">Compra</h2>
    <p style="color:#333;margin:0 0 8px">${esc(report.buyOption.summary)}</p>
    <ul style="padding-left:18px;margin:0">${solutions}</ul>

    <h2 style="font-size:16px;margin:24px 0 8px">Costruisci</h2>
    <p style="color:#333;margin:0 0 8px">${esc(report.buildOption.summary)}</p>
    <p style="color:#333;margin:0"><strong>Costo stimato:</strong> ${esc(report.buildOption.estimatedCostRange)}<br>
       <strong>Tempi stimati:</strong> ${esc(report.buildOption.estimatedTimeline)}<br>
       <strong>Manutenzione:</strong> ${esc(report.buildOption.maintenanceNote)}</p>

    <h2 style="font-size:16px;margin:24px 0 8px">Confronto per dimensione</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead><tr>
        <th style="text-align:left;padding:8px;color:#999;font-weight:500">Dimensione</th>
        <th style="text-align:left;padding:8px;color:#999;font-weight:500">Compra</th>
        <th style="text-align:left;padding:8px;color:#999;font-weight:500">Costruisci</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="background:#0a0a0a;color:#fff;border-radius:12px;padding:20px;margin:24px 0">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#bbb;margin:0">${esc(LEAN_LABELS[report.contextualLean.tipsToward])}</p>
      <p style="margin:12px 0 0;line-height:1.5">${esc(report.contextualLean.reasoning)}</p>
      <div style="background:rgba(255,255,255,.1);border-radius:8px;padding:12px;margin-top:16px">
        <p style="font-size:13px;color:#ccc;margin:0">Prossimo passo</p>
        <p style="margin:4px 0 0;line-height:1.5">${esc(report.contextualLean.nextStep)}</p>
      </div>
    </div>

    <p style="font-size:12px;color:#999;line-height:1.5">${esc(report.confidenceNote)}</p>
  </div>`;
}

/** Sends the report. Throws EmailNotConfiguredError if keys are missing. */
export async function sendReportEmail(to: string, report: Report): Promise<void> {
  const { client, from } = getResend();
  await client.emails.send({
    from,
    to,
    subject: `Compra o Costruisci — confronto per "${report.category}"`,
    html: reportHtml(report),
  });
}
