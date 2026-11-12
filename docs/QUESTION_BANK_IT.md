# Quizario v0.2: archivio domande, importazione e difficoltà

## Stato reale dell'implementazione

- **Pronto e verificato in SQLite locale:** migrazione `0002_question_bank.sql`, categorie, fonti/licenze, stati editoriali, opzioni, statistiche aggregate, tabelle temporanee di partita, deduplica, layout della sfida giornaliera e script SQL di ricalibrazione.
- **Pronto come utility:** importatore Node senza dipendenze (`scripts/import-open-questions.mjs`), importi idempotenti in **bozza** e con fonte associata. Testabile senza rete con il fixture in `examples`.
- **Programmata nel Worker:** manutenzione giornaliera alle 03:10 UTC (ricalibrazione dei dati validi + pulizia righe scadute). L'orario corrisponde alle 04:10/05:10 a Roma, secondo l'ora solare/legale.
- **Ancora da implementare e collaudare:** API partita server-side, endpoint restituzione domande senza chiave di risposta, validazione delle risposte, incremento statistiche con protezione abusi, generazione/persistenza delle 10 domande giornaliere e sostituzione delle domande demo nella UI Angular. La semplice presenza delle tabelle non rende già operative queste funzioni.

## Modalità

### Quiz libero

Scelta categoria e difficoltà `easy`, `medium`, `hard` o `mixed`, oltre al numero di domande (5/10/20, configurabile). Il Worker legge solo domande `published`, `language='it'`. Non restituire mai `question_options.is_correct` al browser prima della risposta. Per campionare senza `ORDER BY RANDOM()` su tutto il DB, usare `selection_key` con pivot casuale e indice composto:

```sql
SELECT id,prompt FROM questions
WHERE status='published' AND language='it'
  AND category_slug='geografia' AND effective_difficulty='medium'
  AND selection_key>=123456789
ORDER BY selection_key LIMIT 10;
```

Se non bastano le domande, fare una seconda query con `selection_key < pivot`; evitare i `question_id` già scelti nella sessione. Servono anche controlli per evitare domande ripetute nello stesso quiz.

### Sfida giornaliera

Ogni giorno (data `Europe/Rome` calcolata **dal Worker**, non fidandosi dell'ora del client) costruire **una sola volta** 10 righe in `daily_quiz_questions`: 3 facili, 4 medie, 3 difficili. La scelta va eseguita in una transazione idempotente: una volta creato il set, tutte le sessioni leggono quelle stesse righe in ordine. La tabella salva `tier_snapshot`: una futura ricalibrazione non deve cambiare la difficoltà visualizzata di una giornata già pubblicata. Se mancano domande in un livello, meglio non pubblicare ancora quel quiz che riempirlo con risposte ripetute. Una futura revisione/ritiro di una domanda va gestita come correzione editoriale esplicita, non con sostituzione casuale.

### API da completare

```
POST /api/quiz/start       {mode, category?, difficulty?, count?}
GET  /api/quiz/:sessionId  -> {questionId, prompt, options: [{index,text}], progress}
POST /api/quiz/answer      {sessionId, position, selectedOptionIndex}
POST /api/quiz/finish      {sessionId}
GET  /api/quiz/daily       -> {date, ready, total:10}
```

Le richieste vanno associate a sessioni non indovinabili, con scadenza, anti-replay e limiti di frequenza. La risposta corretta va controllata sul Worker, mai accettando un flag `isCorrect` dal client. Per le classifiche, usare soltanto risultati verificati sul server.

## Workflow di importazione (Wikidata e OpenTDB)

1. Script **offline/editoriale** eseguito manualmente o da CI a cadenza limitata, non durante i quiz degli utenti.
2. I dati strutturati Wikidata (CC0) entrano con la fonte Q-ID; generiamo in italiano testo e 3 distrattori non identici. Lo script contiene 2 ricette: `capitals` (Stati sovrani con una sola capitale nel risultato) e `elements` (numero atomico). Da **revisionare**, perché dati contestati, insufficienti, nomi italiani e distrattori possono essere problematici.
3. Come sorgente secondaria, `opentdb`: domande in inglese, originali CC BY-SA 4.0, restano in `draft` e **non possono essere pubblicate** finché non vengono tradotte/verificate con attribuzione e termini corretti. Non mescolare silenziosamente la licenza degli adattamenti con le domande CC0 originali.
4. `INSERT OR IGNORE` e `content_hash` impediscono reimport di testi identici, senza sovrascrivere modifiche umane. Un eventuale controllo semantico più sofisticato va aggiunto prima di andare in produzione.
5. Revisione: controllare univocità, correttezza delle quattro opzioni, chiarezza, difficoltà iniziale, fonte, spiegazione; impostare `verified_at`, poi `status='published'`. Il trigger DB blocca le pubblicazioni incomplete.

### Comandi

Dopo `npm install` e `npm run db:migrate:local`, per la prova offline senza rete:

```bash
npm run questions:preview
npm run questions:import:local
python tests/question-bank.test.py
```

Per importazione reale, con User-Agent identificabile richiesto dal servizio Wikimedia:

```bash
# bash/macOS/Linux: adattare il contatto al proprio dominio
export QUIZARIO_USER_AGENT='QuizarioImporter/0.2 (https://tuodominio.it; contact: info@tuodominio.it)'
node scripts/import-open-questions.mjs --dataset=capitals --limit=100 --output=imports/capitals-live.sql
node scripts/import-open-questions.mjs --dataset=elements --limit=100 --output=imports/elements-live.sql
npx wrangler d1 execute DB --local --file imports/capitals-live.sql
```

Su Windows PowerShell:

```powershell
$env:QUIZARIO_USER_AGENT='QuizarioImporter/0.2 (https://tuodominio.it; contact: info@tuodominio.it)'
node scripts/import-open-questions.mjs --dataset=capitals --limit=100 --output=imports/capitals-live.sql
```

Il generatore usa poche query SPARQL mirate, con `Retry-After` su 429 e nessuna richiesta alla partita. Wikimedia richiede User-Agent esplicito; evitare scraping massivo e seguire eventuali modifiche al query endpoint negli anni 2026-2027.

OpenTDB (importa solo fino a 50 domande per richiesta; resta tutto in inglese/bozza):

```bash
node scripts/import-open-questions.mjs --dataset=opentdb --limit=50 --output=imports/opentdb-en.sql
```

Per portare un file import in produzione **solo dopo** aver fatto backup e verificato lo schema:

```bash
npm run db:migrate:remote
npx wrangler d1 execute DB --remote --file imports/capitals-live.sql
```

### Pubblicazione dopo revisione

```sql
-- Esempio: selezionare una domanda per ID, controllarla in dashboard.
SELECT q.id, q.prompt, q.explanation, q.status, q.source_url,
       o.option_index, o.answer_text, o.is_correct
FROM questions q JOIN question_options o ON q.id=o.question_id
WHERE q.id='INSERIRE_ID_QUESTION' ORDER BY o.option_index;

-- Dopo verifica umana e correzioni (se necessarie):
UPDATE questions SET verified_at=datetime('now'), status='published',
  published_at=datetime('now'), updated_at=datetime('now')
WHERE id='INSERIRE_ID_QUESTION' AND status IN ('draft','review');
```

## Ricalibrazione automatica

Chiama la difficoltà iniziale `editor_difficulty` e quella usata nel gioco `effective_difficulty`. Il problema da evitare è una domanda sbagliata che diventa 'difficile' perché tutti rispondono male. **Prima serve moderazione delle segnalazioni.**

1. Solo prime risposte valide per coppia (domanda, giocatore) nella finestra di deduplica di 30 giorni. User login -> identificativo pseudonimizzato con HMAC, guest -> ID casuale server-side (non indirizzo IP). Un account ospite può essere abusato: limiti richiesta e anti-bot sono necessari.
2. `question_stats` conserva soltanto il totale e il numero corretto; `question_rating_dedupe` conserva una chiave pseudonima fino alla scadenza, poi viene eliminata.
3. Dopo **100 risposte valide**, calcolo di una quota corretta aggiustata con **20 pseudo-voti** legati alla difficoltà originale (prior easy=85%, medium=60%, hard=30%). Formula: `(correct_attempts + 20 × prior) / (rated_attempts + 20)`.
4. Livelli con isteresi: easy->medium se <75%, medium->easy se >85%, medium->hard se <40%, hard->medium se >50%. Il cambio è al massimo di **un livello per esecuzione**; cooldown 7 giorni per stabilizzare.
5. La job giornaliera applica `scripts/recalibrate.sql` ed elimina i dati scaduti. Le domande senza statistiche restano con difficoltà editoriale.
6. Nelle classifiche, snapshot delle difficoltà/punti al momento della partita: i punteggi passati non devono cambiare dopo una riclassificazione.

**Limitazione importante:** finché l'API `answer` non registra tentativi server-side validi e la deduplica, le statistiche sono vuote e la ricalibrazione programmata non produce effetti.

### Query diagnostiche

```sql
SELECT category_slug,status,effective_difficulty,COUNT(*) n
FROM questions GROUP BY category_slug,status,effective_difficulty;

SELECT q.id,q.prompt,s.rated_attempts,s.correct_attempts,
 ROUND(100.0*s.correct_attempts/NULLIF(s.rated_attempts,0),1) AS success_pct
FROM questions q JOIN question_stats s ON s.question_id=q.id
WHERE s.rated_attempts>=100 ORDER BY success_pct ASC LIMIT 30;
```

## Consumi e vincoli

- Indici su categoria/difficoltà/pivot, no scansione di tutte le domande con `ORDER BY RANDOM()`.
- Non memorizzare un record permanente per ogni risposta: sessioni di gioco scadono in 48 ore, dati deduplica in 30 giorni; un job li elimina. Per `quiz_results`, conservare soltanto i riepiloghi che servono davvero e definire una retention in informativa privacy.
- Attenzione: D1 Free ha 500 MB per singolo database, 5 milioni di righe lette/giorno, 100.000 righe scritte/giorno. Dal 1 settembre 2026, superare i limiti gratuiti può causare errori sulle query fino al reset. Misurare `meta.rows_read` e `meta.rows_written`, non il mero numero di chiamate.
- Alti volumi di partite possono richiedere una strategia di aggregazione eventi meno costosa; i voti non devono necessariamente essere scritti in D1 a ogni clic. Fare benchmark prima di ampliare il traffico.
- La licenza CC BY-SA di OpenTDB comporta attribuzione e condivisione delle modifiche soggette a ShareAlike; mantenere separati gli asset e gli output con licenze diverse.

## Fonti ufficiali verificate (novembre 2026)

- Wikidata CC0: https://www.wikidata.org/wiki/Wikidata:Licensing
- Wikimedia API etiquette e SPARQL: https://www.wikidata.org/wiki/Wikidata:Data_access/en
- OpenTDB licenza: https://opentdb.com/api_config.php
- D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- D1 pricing: https://developers.cloudflare.com/d1/platform/pricing/
- D1 migrations: https://developers.cloudflare.com/d1/reference/migrations/
- D1 indexes: https://developers.cloudflare.com/d1/best-practices/use-indexes/
