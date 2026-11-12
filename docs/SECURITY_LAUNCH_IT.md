# Quizario: sicurezza degli account prima del primo deploy

Stato: **codice implementato, NON ancora attivo su Cloudflare**. Il semplice merge su `main` non distribuisce il Worker.

## Funzionalità

- **Rate limiting nativo Cloudflare Workers**, senza richieste di scrittura a D1 per ogni tentativo:
  - `AUTH_RATE`: massimo approssimativo 12 tentativi/minuto per indirizzo IP e per hash email su `/api/auth/*` POST e modifiche account;
  - `QUIZ_RATE`: massimo approssimativo 90 richieste/minuto per IP su `/api/quiz/*` e `/api/admin/*`.
  - Il limite è approssimativo e dipende dal data center Cloudflare; per maggiore protezione, configurare anche regole Cloudflare WAF e monitorare gli abusi.
- **Turnstile obbligatorio** prima di registrarsi o richiedere il reset password: il Worker chiama Siteverify e verifica `success`, `action` e nome host esatto. Un token non valido/scaduto fallisce; client resetta il widget quando una richiesta fallisce.
- **Recupero password**: invia da Worker via API Resend un link valido per 30 minuti con token firmato HMAC; la firma dipende dalla password corrente, dunque dopo il primo cambio tutti i link precedenti diventano inutilizzabili. La modifica revoca tutte le sessioni dell'utente. Risposta generica evita di confermare l'esistenza dell'email.
- Cookie autenticazione con prefisso `__Host-`, attributi `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/` e nessun `Domain`.
- Schermate `/forgot-password` e `/reset-password`. Il token di recupero è nel **fragment** dell'URL, non nella query HTTP, e viene subito rimosso dalla barra degli indirizzi.
- Nessuna nuova tabella D1 o migrazione necessaria.

## Configurazione Cloudflare Worker

Configurare nel Worker `quizario` su Cloudflare → Workers & Pages → Settings → Variables and Secrets **prima** di aprire registrazioni. Gli environment secrets GitHub del gruppo `Environments` sono separati e non configurano automaticamente il Worker.

| Nome | Tipo | Valore |
|---|---|---|
| `TURNSTILE_SITE_KEY` | variabile pubblica | Chiave pubblica del widget Turnstile per i tuoi host |
| `TURNSTILE_SECRET_KEY` | **secret** | Chiave segreta del medesimo widget |
| `TURNSTILE_HOSTNAMES` | variabile | Lista senza protocollo, separata da virgola, per esempio `quiz.tuodominio.it,quizario.workers.dev` (solo host effettivamente usati) |
| `PASSWORD_RESET_SECRET` | **secret** | Stringa CASUALE di almeno 32 caratteri; generala con un password manager. Conservala stabile fino a rotazione programmata. |
| `RESEND_API_KEY` | **secret** | API key del provider email, limitata alle spedizioni |
| `MAIL_FROM` | variabile | Mittente verificato presso Resend, per esempio `Quizario <noreply@tuodominio.it>` |
| `PUBLIC_BASE_URL` | variabile | **URL HTTPS canonico** della PWA, inclusa barra finale, ad es. `https://quiz.tuodominio.it/` |
| `ADMIN_EMAILS` | variabile | Elenco email amministrative già previsto |
| `RATING_PEPPER` | **secret** | Già previsto per il conteggio anti-duplicazione dei risultati |

Per Turnstile, creare un widget nella sezione **Turnstile** del dashboard Cloudflare e associare soltanto gli host autorizzati. Turnstile presenta sitekey pubblica e secret privata. Testare **sia il widget sia la convalida server**: un widget non verificato dal Worker non offre protezione.

Resend richiede un **dominio mittente verificato** e configurazione DNS corretta prima dell'invio. Non inserire mai le chiavi nel repo o nel frontend. Senza tutti i parametri di reset, `/forgot-password` mostra il servizio non disponibile. Senza Turnstile completo, `/register` mostra la registrazione non disponibile (fail closed).

**Attenzione**: il rate limiter Cloudflare è approssimativo e opera per punto di presenza; non garantisce un limite globale assoluto contro bot distribuiti. Per carichi elevati valutare regole WAF/Turnstile aggiuntive e limiti di invio email del provider. Le chiavi di rate limit sono SHA-256 di IP e email, non persistite nel database dell'app, ma Cloudflare tratta comunque dati tecnici di connessione.

## Test di pre-lancio obbligatori

1. Verificare `npm run check`, `npm run security:tests`, CI verde, e test browser mobile/tablet.
2. Simulare 13 login/minuto dalla stessa rete: verificare status `429` e messaggio comprensibile. Verificare anche che i quiz non effettuino scritture eccessive su D1.
3. Tentare registrazione senza token, token manipolato, token scaduto, token per `recover` usato su `register`, host errato: tutte rifiutate.
4. Registrazione con Turnstile valido; verifica cookie HttpOnly/Secure/`__Host-`, logout e cancellazione account.
5. Richiesta recupero email esistente e inesistente: **stessa risposta**; nessun reset token nei log. Verificare che il messaggio sia consegnato senza essere classificato come spam.
6. Utilizzare il link una volta, controllare che il login vecchio e le altre sessioni non funzionino più, e che lo stesso link non funzioni dopo il cambio password.
7. Aggiornare e **finalizzare** la pagina privacy: identità e contatti del titolare, presupposti giuridici, dati dei fornitori, paesi trattati e tempi di conservazione effettivi. Verificare gli accordi con Cloudflare/Resend e le misure per i trasferimenti internazionali.
8. Testare protezione abuso anche su quiz/endpoint amministratore e valutare limitazione traffico dalle regole Cloudflare WAF.
9. Evitare di distribuire i siti reali finché la sicurezza e l'informativa non sono completate.

## Fonti tecniche

- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/
- https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32016R0679

*Nota*: questa guida e il testo privacy costituiscono una base tecnica e non sostituiscono la verifica legale prima della raccolta di dati reali.