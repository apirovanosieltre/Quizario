# Quizario: obiettivi giornalieri e nuova banca domande

## Obiettivo giornaliero
- Una sfida giornaliera completata = obiettivo 1/1, anche con 0 risposte corrette.
- Streak e record sono calcolati per data **Europe/Rome** (non dalle 24 ore trascorse).
- Fino all'esecuzione della sfida di oggi, si mostra la serie di ieri; se salti un giorno intero si interrompe.
- Calendario delle ultime 4 settimane (28 giorni), traguardi di 3, 7, 14, 30 giorni.
- Per utenti registrati il Worker ricava i dati dalle partite completate in D1; per ospiti si usano solo i progressi locali nel browser.
- Nessuna tabella nuova. Il Worker legge fino a 400 risultati giornalieri per account; il record mostrato si basa sullo storico disponibile.

## 60 nuove domande originali in quattro categorie
- 15 Storia, 15 Sport, 15 Cinema e TV, 15 Cultura generale.
- Per categoria: 5 facili, 5 medie, 5 difficili.
- Risposte e spiegazioni scritte originalmente; link alla pagina di riferimento per la **verifica editoriale**, NON dichiarati come fonti già verificate.
- Importazione automatica come `draft`, con `verified_at = NULL`. Il workflow NON imposta `published`.
- Le categorie appariranno giocabili con quiz liberi solo dopo che un amministratore avrà verificato e pubblicato abbastanza domande.
- L'approvazione è individuale nel pannello `/admin` e richiede esplicitamente una fonte verificata. Non pubblicare tutte in blocco senza controllo.

## Deployment
La PR introduce il workflow `Import 60 Quizario editorial drafts (never publish)`.
Al merge in `main` parte il controllo schema, il test locale SQLite, l'import D1 non distruttivo e una verifica read-only del risultato. Può richiedere approvazione dell'ambiente GitHub `Environments`. Non effettua il deploy del sito Worker/PWA.

## Verifica D1
```sql
SELECT category_slug, effective_difficulty, status, COUNT(*) AS total
FROM questions WHERE import_batch_id='editorial_20261113_60'
GROUP BY category_slug,effective_difficulty,status
ORDER BY category_slug,effective_difficulty,status;
```
