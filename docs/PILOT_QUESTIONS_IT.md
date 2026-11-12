# Quizario: prime 30 domande pubblicate (pilota)

## Scopo

La prima pubblicazione rende testabili il quiz libero e la sfida giornaliera su D1 remoto, **senza importare le domande QA locali** e senza eseguire il deploy pubblico del sito.

La banca è composta da 30 domande originali, revisionate rispetto a dati pubblici:

- 15 capitali (Geografia): 5 facili, 5 medie, 5 difficili; fonte per ciascuna domanda: scheda del Paese su Wikidata (CC0).
- 15 domande su simboli e numeri atomici (Scienza): 5 facili, 5 medie, 5 difficili; dati verificati con la tavola periodica IUPAC. Testi e distrattori sono originali di Quizario, non tratti da tavole o opere grafiche IUPAC.

[Controlla il dataset sorgente](../seeds/pilot-questions.json) prima di modificare le risposte. Lo script `scripts/prepare-pilot.mjs` si rifiuta di generare SQL in caso di conteggi, opzioni, fonti o difficoltà non coerenti.

## Pubblicazione D1

Al primo merge su `main` che crea il file `seeds/pilot-questions.json`, GitHub Actions esegue il workflow `Publish first 30 Quizario questions (one-off pilot)` usando i due secret dell'ambiente **Environments**. Questo workflow:

1. verifica lo schema remoto senza scrivere;
2. esegue i test SQLite, inclusi i trigger di pubblicazione e l'idempotenza;
3. genera e archivia il SQL esatto;
4. inserisce domande dapprima come *draft*, poi pubblica soltanto i 30 record identificati da `pilot_20261112_*` dopo la validazione D1;
5. verifica che esistano 5 domande per ciascuna delle 6 coppie categoria/difficoltà.

Le esecuzioni successive sono idempotenti. Se una domanda viene successivamente ritirata o corretta, il SQL non la ripubblica in automatico. L'amministratore potrà lavorare sulle bozze regolari dal pannello `/admin`.

**Rischio operativo:** il token Cloudflare deve avere permesso D1 Edit sul database `quizario-db`. Se l'environment GitHub richiede un'approvazione, concederla solo dopo aver verificato il contenuto della PR. Se la prima esecuzione fallisce, il workflow può essere rilanciato manualmente da `main` con `PUBBLICA_30`.

## Verificare dal Dashboard Cloudflare

```sql
SELECT category_slug, effective_difficulty, status, COUNT(*) AS totale
FROM questions
WHERE import_batch_id IN ('pilot_20261112_geografia','pilot_20261112_scienza')
GROUP BY category_slug,effective_difficulty,status
ORDER BY category_slug,effective_difficulty;
```

Risultato atteso: **sei righe**, ciascuna `published` con **5 domande**.

Il quiz libero deve mostrare due categorie giocabili; la sfida giornaliera deve disporre dei 3 quiz facili, 4 medi, 3 difficili necessari per la giornata. Gli snapshot giornalieri già esistenti non vengono alterati.

**Attenzione:** questa procedura pubblica le **domande nel database**, non il sito. Per testare l'interfaccia web occorre comunque il primo deploy del Worker/asset Angular.