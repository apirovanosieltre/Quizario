# Deploy Quizario su Cloudflare Workers: dominio pubblico e API

## Obiettivo
Distribuire **insieme** l'app Angular (asset PWA) e il Worker `worker/index.ts` su `quizario.cicioweb.app`, in modo che gli endpoint `/api/health` e `/api/security/config` rispondano con JSON e non con un 404 da una vecchia distribuzione statica.

## Pipeline GitHub
Workflow: `.github/workflows/deploy-quizario.yml`.

- Primo avvio automatico al merge del workflow/config su `main`; in seguito anche manualmente da **Actions → Deploy Quizario website and API Worker → Run workflow**.
- Ambiente GitHub: `Environments`, con `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_API_TOKEN` già usati dai workflow D1.
- Build Angular, type-check Worker, test API e sicurezza, verifica D1 e tabella opt-in, poi `npx wrangler deploy`.
- Il dominio è configurato come `routes: [{pattern:'quizario.cicioweb.app',custom_domain:true}]` nel file `wrangler.jsonc`.
- Un controllo di fine deploy verifica homepage, `/api/health`, `/api/security/config` e `/api/quiz/catalog`.

## Token Cloudflare
Il token usato per D1 potrebbe NON avere i permessi per distribuire Worker o modificare il routing del dominio. Se il workflow segnala autorizzazioni insufficienti, creare/modificare il token in Cloudflare per includere **Workers Scripts Edit**, oltre a **D1 Edit**, e i permessi eventualmente richiesti per il **Custom Domain / zone cicioweb.app** (verificare gli errori puntuali di Wrangler). Aggiornare `CLOUDFLARE_API_TOKEN` nei secrets dell'ambiente GitHub `Environments`. Non aggiungere token o secret al repository.

## Se un altro Pages project controlla quizario.cicioweb.app
Un hostname può essere già collegato a un Pages project o a un'altra route. Il deploy con `custom_domain:true` potrebbe fallire con un errore di conflitto. In Cloudflare, controllare Workers & Pages → vecchio progetto → Domains/Routes e rimuovere l'**associazione del solo sottodominio Quizario** prima di ritentare il workflow; non eliminare o modificare l'intero dominio principale `cicioweb.app`, né gli altri siti.

## Test dopo il deploy
- `https://quizario.cicioweb.app/api/health` → JSON `{"ok":true,"service":"quizario"}`.
- `https://quizario.cicioweb.app/api/security/config` → JSON con `registrationEnabled` booleano.
- `https://quizario.cicioweb.app/api/quiz/catalog` → JSON con `categories`.
- `https://quizario.cicioweb.app/` → home Angular.
- `https://quizario.cicioweb.app/admin` → pannello con API riservate all'email presente in `ADMIN_EMAILS`.
- `https://quizario.cicioweb.app/classifica` → classifica opt-in.

## Registrazioni ancora da configurare
Il deploy **non** crea credenziali Turnstile o abilita automaticamente registrazioni. Per far funzionare `/register`, nel Worker configurare:
- `TURNSTILE_SITE_KEY` (variabile), `TURNSTILE_SECRET_KEY` (secret), `TURNSTILE_HOSTNAMES=quizario.cicioweb.app` (variabile).
- `ADMIN_EMAILS` è una variabile separata che autorizza l'accesso al pannello per account già registrati.
- Recupero password richiede anche Resend e relativi secret; non serve per il deploy base.

**Privacy:** l'informativa attuale è una bozza. Prima di aprire le registrazioni pubbliche deve essere finalizzata e approvata. Evitare di condividere pubblicamente i link di registrazione fino a quel momento.
