import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Informativa Privacy e Cookie | Sviluppa o Compra',
  description:
    'Come trattiamo i dati personali raccolti dallo strumento Sviluppa o Compra, in conformità al GDPR.'
};

const CONTACT = 'privacy@fiscet.it';
const LAST_UPDATED = '8 giugno 2026';

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="text-sm font-medium text-teal hover:text-teal-dark"
      >
        ← Torna allo strumento
      </Link>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-navy">
          Informativa sulla Privacy e sui Cookie
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Ultimo aggiornamento: {LAST_UPDATED}
        </p>

        <section className="mt-8 space-y-4 text-ink-soft">
          <p>
            Questa informativa descrive come lo strumento{' '}
            <strong>Sviluppa o Compra</strong>, di proprietà di Christian
            Zanchetta (fiscet.it), tratta i dati personali degli utenti in
            conformità al Regolamento Generale sulla Protezione dei Dati (GDPR).
          </p>

          <div>
            <h2 className="text-lg font-semibold text-ink">
              1. Titolare del Trattamento
            </h2>
            <p className="mt-2">
              Il Titolare del trattamento è Christian Zanchetta. Per qualsiasi
              richiesta puoi scriverci a{' '}
              <a href={`mailto:${CONTACT}`} className="text-teal underline">
                {CONTACT}
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink">2. Dati raccolti</h2>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <strong>Descrizione del processo</strong> e le opzioni indicate
                (dimensione del team, budget, tempistiche) che inserisci per
                generare il confronto.
              </li>
              <li>
                <strong>Email</strong> e, facoltativamente, il{' '}
                <strong>nome dell&apos;azienda</strong>, solo se scegli di
                richiedere il report via email.
              </li>
              <li>
                <strong>Report generato</strong>, conservato insieme alla
                richiesta per poterti ricontattare e per migliorare il servizio.
              </li>
            </ul>
            <p className="mt-2">
              Non raccogliamo categorie particolari di dati. Ti chiediamo di non
              inserire dati personali di terzi o informazioni riservate nella
              descrizione del processo. Se la richiesta non rientra nei casi
              trattati dallo strumento, conserviamo la sola descrizione in forma
              anonima (senza email) per capire quali aree coprire in futuro.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink">
              3. Finalità e base giuridica
            </h2>
            <p className="mt-2">
              I dati inseriti nel form sono trattati per generare il confronto
              richiesto (esecuzione di un servizio da te richiesto). Email e
              azienda sono trattati sulla base del tuo <strong>consenso</strong>
              , per inviarti il report ed eventualmente ricontattarti riguardo a
              servizi di sviluppo su misura. Puoi revocare il consenso in
              qualsiasi momento scrivendo a {CONTACT}.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink">
              4. Fornitori e trasferimenti
            </h2>
            <p className="mt-2">
              Per erogare il servizio ci avvaliamo di fornitori che agiscono
              come responsabili del trattamento: la generazione del confronto
              usa modelli linguistici (OpenAI e Groq), i lead sono archiviati su
              database Turso e le email sono inviate tramite Resend. Alcuni
              fornitori possono trattare i dati al di fuori dell&apos;UE, con
              garanzie adeguate previste dal GDPR.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink">
              5. Periodo di conservazione
            </h2>
            <p className="mt-2">
              I lead (email, azienda, descrizione e report) sono conservati fino
              alla tua richiesta di cancellazione o alla cessazione del
              servizio.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink">
              6. I tuoi diritti
            </h2>
            <p className="mt-2">
              Hai diritto di accesso, rettifica, cancellazione, limitazione e
              portabilità dei dati, oltre al diritto di opporti al trattamento.
              Per esercitarli scrivi a{' '}
              <a href={`mailto:${CONTACT}`} className="text-teal underline">
                {CONTACT}
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink">7. Cookie</h2>
            <p className="mt-2">
              Questo sito{' '}
              <strong>
                non utilizza cookie di profilazione né strumenti di analisi di
                terze parti
              </strong>
              . Vengono usati solo eventuali cookie tecnici strettamente
              necessari al funzionamento. Se in futuro introdurremo cookie di
              analisi, lo faremo previa informativa e raccolta del consenso.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
