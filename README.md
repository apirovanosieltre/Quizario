# Quizario v0.3 · Quiz PWA italiana

Starter **indipendente da Minigames Online**: Angular 22 (standalone), Cloudflare Workers, D1, PWA, tema prugna/corallo/menta. Questa è una base tecnica da collaudare prima del deploy, non una release pubblica.

## Novità v0.3

- Homepage e categorie lette da `/api/quiz/catalog` (solo domande pubblicate).
- **Quiz libero**: categoria, difficoltà facile/media/difficile/mista e 5/10/15 domande (richiede almeno tante domande pubblicate quanto il numero richiesto).
- **Sfida giornaliera**: 10 domande uguali per tutti, 3 facili, 4 medie, 3 difficili. Snapshot su D1 e data determinata nel fuso `Europe/Rome`.
- API server-authoritative: il browser riceve prompt + 4 alternative, **mai le chiavi delle risposte prima del tentativo**; una sola risposta per posizione, controllo del token, ordine obbligatorio.
- Recupero dopo ricarica tramite `sessionStorage`; gli utenti autenticati possono recuperare la sfida giornaliera anche senza il token locale.
- Risultati riepilogativi per account (`quiz_results`) visibili in `/account` e statistiche locali per dispositivo. Non salviamo uno storico permanente di ogni singola risposta.
- Ricalibrazione automatica della difficoltà (solo da risposte valide di utenti autenticati, quando `RATING_PEPPER` è configurato; dedupe pseudonimo temporaneo).
- `/admin` per vedere bozze e approvare/rifiutare domande, riservato alle email configurate in `ADMIN_EMAILS`. Il pulsante di pubblicazione richiede conferma di verifica umana.
- 32 domande **solo per QA locale**, separate dai dati reali, etichettate come NON verificate per la produzione.
- Migrazione `0003_quiz_play.sql`: impedisce più sfide giornaliere per account/data.

## Requisiti

- Node.js >= 22.22.3, npm e Cloudflare Wrangler.
- Python 3.10+ per la suite di test SQLite/API offline.
- Per il test del Worker locale va creato prima l'output Angular statico.

## Sviluppo locale (primo avvio)

```bash
npm install
npm run build
npm run db:migrate:local
npm run questions:qa:prepare
npm run questions:qa:local
```

Il seed QA è **solo locale**; non usarlo per il database di produzione. La pubblicazione di domande reali deve passare dal controllo editoriale.

Avvia due terminali:

```bash
npm run dev:api     # Terminale 1, Worker/D1 locale su localhost:8787
npm run start       # Terminale 2, Angular su localhost:4200
```

Apri `http://localhost:4200` e prova un quiz libero oppure `/quiz/daily`. Per il profilo, registrati con un account locale e completa una partita.

### Amministrazione locale

Wrangler legge le variabili in `.dev.vars` (non committarlo):

```ini
ADMIN_EMAILS="indirizzo-email-del-tuo-account-locale@example.com"
RATING_PEPPER="un-segreto-casuale-di-almeno-32-caratteri"
```

Apri `/admin` solo dopo aver effettuato il login con quell'email. Per provare il flusso di moderazione importa una bozza originale:

```bash
npm run questions:preview
npm run questions:import:local
```

Le 7 domande da fixture Wikidata sono in stato `draft`: apri il tab **Bozze**, verifica e pubblica soltanto quelle corrette. L'importatore OpenTDB produce bozze in inglese e non sono pubblicabili finché non sono tradotte, spiegate e verificate.

### Test

```bash
npm run questions:tests
npm run questions:engine-tests
npm run questions:api-tests
npm run typecheck:worker
npm run build
```

I test API offline usano Python SQLite in memoria con un adattatore D1 minimo, non il runtime Wrangler. Il build Angular completo e i test browser devono ancora essere eseguiti in un ambiente con dipendenze npm installate.

## Deployment Cloudflare (non ancora eseguito)

1. Crea **un D1 nuovo** `quizario-db` (mai riutilizzare il database di Minigames Online).
2. Sostituisci `database_id` segnaposto in `wrangler.jsonc` con l'UUID reale.
3. Configura `ADMIN_EMAILS` in Cloudflare (variabile non segreta) e `RATING_PEPPER` come **secret** con `npx wrangler secret put RATING_PEPPER` (genera almeno 32 caratteri casuali). Senza pepper i risultati funzionano, ma non contribuiscono alla ricalibrazione.
4. Applica migrazioni con `npm run db:migrate:remote` **dopo averle esaminate**.
5. Importa **solo contenuti verificati** tramite la pipeline delle bozze; non importare `imports/qa-only-local.sql`.
6. Dopo privacy, protezione anti-bot/anti-bruteforce, test end-to-end, accessibilità e backup, esegui `npm run deploy`.

**Non esporre pubblicamente registrazioni reali prima di avere completato privacy/GDPR, rate limiting/Turnstile e hardening dell'autenticazione.** Il recupero password e le notifiche email non sono ancora implementati.

## API nuove

| Metodo | Endpoint | Descrizione |
|---|---|---|
| GET | `/api/quiz/catalog` | Categorie, numero domande pubblicate e livelli disponibili |
| POST | `/api/quiz/start` | Avvia `free` (category, difficulty, count) o `daily` |
| POST | `/api/quiz/resume` | Riprende usando `sessionToken`, o cookie account per la sfida giornaliera |
| POST | `/api/quiz/answer` | Valida `{sessionToken,position,optionIndex}` e restituisce esito e spiegazione |
| GET | `/api/account/results` | Ultimi 30 riepiloghi per utente autenticato |
| GET | `/api/admin/questions?status=draft` | Revisione question bank riservata |
| POST | `/api/admin/questions/:id/publish` | Pubblica solo con `{verified:true}` |
| POST | `/api/admin/questions/:id/reject` | Rifiuta bozza |

Le API account (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/account`) rimangono quelle della v0.2.

## Limiti voluti nella prima release tecnica

- Sfida giornaliera e quiz libero richiedono un numero minimo di domande pubblicate; senza seed locale o pubblicazione reale la UI mostra stato di preparazione.
- Gli ospiti possono giocare, ma il punteggio non viene sincronizzato con un account e i loro tentativi non alimentano la difficoltà. Riconnettersi dopo la scadenza della sessione non recupera le risposte.
- Il risultato server salva il miglior punteggio per data/modalità/categoria/difficoltà/lunghezza, non tutti i tentativi. Le sessioni risposte scadono e vengono cancellate tramite cron; il risultato di una sessione completata non viene mai ricalcolato sul client.
- Niente classifiche pubbliche, leaderboard amici, premi, push o abbonamenti ancora.
- `/admin` è una revisione MVP: nessun editor testuale avanzato, paginazione e audit trail di moderazione da aggiungere prima della scala.
- `wrangler.jsonc` contiene l'UUID D1 segnaposto. Le variabili in `.dev.vars` e i segreti non sono inclusi nello ZIP.

Ulteriori dettagli su licenze e importazioni: [`docs/QUESTION_BANK_IT.md`](docs/QUESTION_BANK_IT.md). Tutte le modifiche sono **solo nei file consegnati**, non su GitHub e non su Cloudflare.

## Cloudflare D1 remoto e importazioni sicure

Consulta [`docs/CLOUDFLARE_D1_IT.md`](docs/CLOUDFLARE_D1_IT.md). Sono disponibili: controllo dello schema remoto di sola lettura, generazione settimanale di bozze da Wikidata senza scrivere in D1 e importazione manuale di lotti limitati (tutti in stato `draft`). **Nessun deploy pubblico automatico**.
## Sicurezza pre-lancio (v0.4)

Sono stati aggiunti rate limiting Workers, Turnstile obbligatorio per la registrazione e il recupero password, link di reset firmati, e nuova bozza dell'informativa privacy. **La registrazione rimane disabilitata finché non sono configurati i secrets Cloudflare. Non eseguire un deploy pubblico prima di aver finalizzato l'informativa e collaudato i flussi.** Configurazione e test: [`docs/SECURITY_LAUNCH_IT.md`](docs/SECURITY_LAUNCH_IT.md).
