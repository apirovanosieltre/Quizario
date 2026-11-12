# Quizario v0.3 · Contratti API e stati

## Avvio partita

`POST /api/quiz/start` con `{"mode":"free","category":"scienza","difficulty":"mixed","count":5}` o `{"mode":"daily"}`.

Risposta 200 (abbreviata):

```json
{
  "sessionToken": "<token-casuale-64-cifre-esadecimali>",
  "mode": "free",
  "date": null,
  "nextPosition": 1,
  "score": 0,
  "questions": [{"id":"...","prompt":"...","difficulty":"easy","options":["A","B","C","D"]}]
}
```

**L'endpoint iniziale non restituisce `is_correct`, `answer`, `correctOptionIndex` o `explanation`.** Il browser non calcola il punteggio autonomamente.

`POST /api/quiz/answer` richiede `{ "sessionToken":"...", "position":1, "optionIndex":2 }` e restituisce, dopo il primo tentativo valido:

```json
{"isCorrect":true,"correctOptionIndex":2,"explanation":"...","score":1,"total":10,"completed":false}
```

L'API rifiuta replay e posizioni fuori ordine (409), token non validi (401), token di altri account (403), partite scadute (410).

`POST /api/quiz/resume` accetta `{ "sessionToken":"..." }`; senza token richiede il cookie di un account che ha una sfida giornaliera ancora attiva. Ritorna le domande pubbliche, il prossimo indice e il punteggio server, con `completed` quando il quiz è finito.

## Giornaliero

La prima richiesta del giorno genera il batch in `daily_quiz_questions`, con 3/4/3 livelli. Le richieste successive leggono lo stesso snapshot. Gli utenti autenticati hanno un solo tentativo per giorno e possono continuarlo dopo un reload. Gli ospiti possono rigiocare ma non sono classificabili. Il calendario è `Europe/Rome` e conserva lo snapshot del giorno anche se la difficoltà delle domande cambia successivamente.

## Privacy e rating

Sono memorizzati temporaneamente session ID, selezioni, esito e timestamp; il cron elimina le sessioni scadute. I risultati permanenti per utenti autenticati contengono solo data, slug di modalità, punteggio, totale, durata, data di completamento. Per la ricalibrazione vengono conteggiati gli utenti autenticati una volta per domanda in una finestra di 30 giorni usando un HMAC pseudonimo prodotto con `RATING_PEPPER`. Senza il segreto non si raccolgono nuovi rating, ma si salvano i punteggi.

## Moderazione

Le nuove domande importate sono sempre `draft`. L'endpoint admin legge massimo 50 record per stato, con opzioni e provenienza. `publish` accetta solo un amministratore autenticato, un'esplicita conferma `verified:true`, domanda in italiano, 4 opzioni distinte, 1 risposta corretta, spiegazione e URL fonte HTTPS. Le scelte e i testi pubblicati sono bloccati da trigger SQLite finché non vengono rimessi in revisione.

Per produzione occorrono revisione legale delle fonti, audit trail editoriale, rate limiting, recovery account, test end-to-end reali con Wrangler, e la scelta di retention dei risultati dopo il periodo di utilizzo previsto.
