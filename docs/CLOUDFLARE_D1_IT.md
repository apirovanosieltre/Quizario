# Quizario: verifica D1, import delle domande e Cloudflare

Questa guida riguarda **il database `quizario-db` già creato manualmente**. Il binding `DB` nel file `wrangler.jsonc` punta all'UUID `7cdc2fc4-4455-482e-b5de-f0365fa3d6e1`.

## 1. Importante: allineare lo storico delle migrazioni

Le tabelle sono state create incollando SQL nella console Cloudflare, non tramite `wrangler d1 migrations apply`. Di conseguenza, la tabella di controllo `d1_migrations` può non esserci. **Non dare per scontato che la migrazione sia già registrata solo perché le tabelle esistono.**

Prima di qualsiasi importazione o deploy:

1. Esegui l'azione **Cloudflare D1 preflight (manual)** su GitHub, oppure da PC `npm run db:verify:remote` dopo aver configurato le credenziali; questo controllo è **di sola lettura** e non cambia il DB.
2. Verifica che trovi **14 tabelle applicative, 14 indici espliciti e 5 trigger**. In caso di dati mancanti, NON eseguire l'import.
3. Per allineare Wrangler, controlla `npx wrangler d1 migrations list quizario-db --remote`. Se indica migrazioni pendenti, fai un backup, esamina i tre file in `migrations/` e applica **solo dopo verifica** `npx wrangler d1 migrations apply quizario-db --remote`. Le migrazioni originarie utilizzano `IF NOT EXISTS` / `INSERT OR IGNORE`, ma **non devi usare questo comando su un database con uno schema differente**. Il comando registra le migrazioni in `d1_migrations`.
4. NON inserire manualmente righe in `d1_migrations`: lascia a Wrangler il controllo del formato e della cronologia.

Se preferisci la console Cloudflare, questo query mostra il numero di tabelle del progetto:

```sql
SELECT COUNT(*) AS app_tables FROM sqlite_master
WHERE type='table' AND name IN (
'users','sessions','quiz_results','question_categories','question_sources','import_batches',
'questions','question_options','question_stats','question_rating_dedupe',
'daily_quiz_questions','quiz_play_sessions','quiz_session_answers','question_reports');
```

Il valore previsto è **14**. È necessario verificare anche indici e trigger: il solo numero di tabelle non basta.

## 2. Credenziali per le GitHub Actions (solo nel pannello GitHub)

Cloudflare Dashboard → profilo → **API Tokens** → Create Token. Prepara un token limitato al solo account Quizario con i permessi strettamente necessari: per verifica D1 Read; per import manuale D1 Write; se vorrai distribuire il Worker, Workers Scripts Edit. È preferibile separare un token di verifica/import da quello di deploy e limitarne la durata.

GitHub → `apirovanosieltre/Quizario` → **Settings → Secrets and variables → Actions → New repository secret**:

- `CLOUDFLARE_ACCOUNT_ID`: ID account Cloudflare (32 caratteri esadecimali; **non** UUID del database).
- `CLOUDFLARE_API_TOKEN`: token API dell'account con almeno i permessi D1 necessari.

**Non pubblicare mai il token in GitHub, nella chat, nelle Issues o nel file `wrangler.jsonc`.** L'UUID del database invece è un identificatore, non una credenziale.

Le workflow `workflow_dispatch` si vedono nel tab Actions dopo che i file sono presenti nel branch predefinito `main`.

## 3. Verifica remota in sola lettura

GitHub → **Actions → Cloudflare D1 preflight (manual) → Run workflow**. Il job confronta le tabelle, gli indici e i trigger con lo schema della v0.3. Non esegue SQL di scrittura, non crea tabelle e non registra migrazioni.

Da PC, con le due variabili Cloudflare nell'ambiente:

```bash
npm run db:verify:remote
```

Se lo schema è incompleto, il job termina con errore e impedisce i successivi import manuali.

## 4. Domande da Wikidata senza consumare quote durante il gioco

### Solo generazione bozza, senza scrivere su Cloudflare

**Actions → Prepare open-data quiz drafts (no D1 writes)** crea ogni lunedì un archivio con SQL di due dataset italiani: capitali e elementi chimici, massimo 50 domande ciascuno. Nessuna bozza è applicata a D1 automaticamente. Scarica e verifica l'artefatto GitHub Actions.

Gli script producono domande a 4 risposte con fonte Wikidata CC0, difficoltà iniziale, spiegazione e `status='draft'`. Un controllo umano è obbligatorio prima di passare `status='published'`. Il codice elimina duplicati tramite hash, seleziona dati non ambigui e applica una selezione prevedibile.

### Import manuale di un piccolo lotto nel DB

**Actions → Import Wikidata D1 drafts (manual, review required)**:

1. Seleziona `capitals` o `elements`.
2. Seleziona limite `10`, `25` o `50`.
3. Digita esattamente `IMPORT_DRAFTS`.
4. Il job **prima** verifica lo schema remoto, **poi** genera SQL e lo applica a `quizario-db`, creando solo **bozze non pubblicate**.
5. Conserva l'artefatto SQL del job. Le domande esistenti e corrette editorialmente non vengono sovrascritte.

**Non** eseguire `imports/qa-only-local.sql` su D1 remoto: è un set di test non verificato.

### Pubblicazione

Solo tramite il pannello privato `/admin`, dopo aver controllato:

- lingua italiana, formulazione non ambigua e data/fonte verificabili;
- quattro risposte distinte e una sola corretta;
- spiegazione corretta e difficoltà editoriale ragionevole.

Per usare `/admin`, il Worker deve avere le variabili `ADMIN_EMAILS` e `RATING_PEPPER`: configurale come **Secrets** nel dashboard Cloudflare → Worker `quizario` → Settings → Variables and Secrets. Il valore di `ADMIN_EMAILS` è l'email esatta dell'account autorizzato. Genera `RATING_PEPPER` come stringa casuale di almeno 32 caratteri; non inserirla nel codice.

## 5. Deploy (non ancora automatizzato né autorizzato)

La CI Angular e i test offline sono disponibili. Il primo deploy pubblico va effettuato **solo dopo** aver completato protezioni anti-bot/rate limiting, privacy/GDPR, test reali di registrazione e protezioni contro consumo abusivo di D1. Non considerare la riuscita della CI equivalente a una release pubblica pronta.

Cloudflare Workers Builds permette il collegamento GitHub, ma per ora **non collegare un deploy automatico a main**. Quando l'app sarà pronta, il comando sarà `npm run deploy` con credenziali Cloudflare (oppure Workers Builds). Non eseguire migrazioni/seed QA automaticamente in deploy.