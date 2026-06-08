# Setup — chiavi servizi esterni

Stato: il codice della **Fase 5 (cattura lead)** è completo e funzionante. Manca solo
creare due account e incollare le chiavi in `.env.local`. Finché non ci sono, l'app gira
normalmente (l'analisi funziona); solo l'invio del report via email risponde con un 503
"non ancora configurato".

Quando crei le chiavi, NON metterle in `.env.example` (è versionato): vanno in `.env.local`.

---

## 1. Turso — storage dei lead (critico)

Il lead è l'unico vero asset dell'app: va salvato in modo durevole. La tabella `leads`
viene creata da sola alla prima scrittura — nessuna migrazione manuale.

### Via CLI (consigliato)
```bash
# installa la CLI
curl -sSfL https://get.tur.so/install.sh | bash

# crea account e database
turso auth signup
turso db create buy-vs-build

# prendi i due valori da incollare in .env.local
turso db show buy-vs-build --url          # -> TURSO_DATABASE_URL (libsql://...)
turso db tokens create buy-vs-build       # -> TURSO_AUTH_TOKEN
```

### In `.env.local`
```
TURSO_DATABASE_URL=libsql://buy-vs-build-<tuo-org>.turso.io
TURSO_AUTH_TOKEN=<il token generato>
```

Il piano gratuito Turso è ampiamente sufficiente per i volumi di un lead magnet.

---

## 2. Resend — invio del report via email

### Passi
1. Crea un account su https://resend.com
2. Crea una **API key** (Settings → API Keys) → `RESEND_API_KEY`
3. Mittente (`RESEND_FROM`):
   - **Per testare subito**, senza dominio: usa `onboarding@resend.dev`. Limite: puoi
     inviare **solo all'email del tuo account Resend**. Ottimo per la prova end-to-end.
   - **Per la produzione**: verifica un tuo dominio (Domains → Add Domain → record DNS),
     poi usa un mittente tipo `Sviluppa o Compra <report@tuodominio.it>`.

### In `.env.local`
```
RESEND_API_KEY=re_...
RESEND_FROM=onboarding@resend.dev          # in prod: "Sviluppa o Compra <report@tuodominio.it>"
```

---

## Come testiamo insieme (al tuo ritorno)
1. Incolla le 4 chiavi in `.env.local`.
2. `npm run dev`
3. Genera un report dalla home, poi inserisci la tua email nel box "Ricevi il report".
4. Verifico: lead salvato su Turso (`turso db shell buy-vs-build "SELECT id,email,category,created_at FROM leads"`)
   e email arrivata.

---

## 3. Rate limiting + gate "2 usi → email" (Fase 6) — nessun account in più

Niente Upstash: rate limiting e gate usano **lo stesso Turso** dei lead (tabelle `usage` e
`rate_limit` create in automatico). Quindi bastano le chiavi Turso del punto 1. Senza Turso il
sistema **degrada in aperto** (nessun limite, nessun gate). Con Turso: max 10 richieste/minuto
per IP (anti-abuso) e dopo 2 analisi gratuite compare il gate email.

### Come testiamo il gate
1. Genera **2 report** di fila dalla home.
2. Alla **3ª** richiesta compare il box "Continua gratuitamente": inserisci email + consenso.
3. Dopo lo sblocco la 3ª analisi parte da sola. (Il lead "email-gate" finisce su Turso.)
   Per ripetere il test: cancella i cookie del sito (resetta `svc_id`).

---

## 4. Exa — refresh mensile della KB (Fase 7)

Il cron è già pronto: ogni mese cerca sul web tool e prezzi per categoria, l'LLM sintetizza e
**aggiorna `data/kb-seed.json` solo se i nuovi dati validano e non sono peggiori** (altrimenti
tiene i vecchi). Senza `EXA_API_KEY` il cron risponde "skipped".

### Passi
1. Crea un account su https://exa.ai (free tier: 1000 richieste/mese, più che sufficienti).
2. Copia la API key → `.env.local`:

```
EXA_API_KEY=...
CRON_SECRET=una-stringa-segreta-a-caso   # protegge l'endpoint del cron
```

### Triggerare/testare a mano
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/refresh-kb
```
Risponde con `version`, `written` e l'esito per categoria (`updated` / `kept` / `error`).
In locale scrive davvero `data/kb-seed.json` (versione + lastUpdated aggiornati).

> NOTA DEPLOY (Fase 8): su Vercel il filesystem è read-only, quindi il cron non può
> riscrivere `data/kb-seed.json` nel bundle. Va deciso il meccanismo di persistenza:
> commit-back del JSON sul repo via GitHub API (rideploy), oppure spostare la KB su Turso/Blob.
> Da affrontare al deploy.

---

## Cosa resta dopo
- **Fase 8 — Deploy** su Vercel (env + cron già in `vercel.json`). Due note:
  1. persistenza KB del cron (vedi sopra);
  2. per garantire la latenza sotto carico, valutare un piano a pagamento sul provider LLM.
