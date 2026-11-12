# Riparazione dei due trigger mancanti in quizario-db

Lo schema Cloudflare D1 è stato verificato: **14/14 tabelle, 14/14 indici, 3/5 trigger**. Mancano soltanto:

- `trg_question_publish_validate`, che richiede le verifiche editoriali prima della pubblicazione;
- `trg_question_options_no_update_published`, che blocca l'aggiornamento delle opzioni di domande pubblicate.

## Esecuzione sicura da GitHub Actions

1. Apri **GitHub → Quizario → Actions → Repair missing D1 triggers (manual)**.
2. Seleziona branch `main` e **Run workflow**.
3. Inserisci esattamente `RIPARA_TRIGGER` nella casella di conferma e avvia.
4. Il job usa i secret del GitHub Environment **Environments** già configurati.
5. Il job esegue due file SQL separati, mediante `wrangler d1 execute DB --remote --file=...`, quindi verifica nuovamente lo schema in sola lettura.

I comandi sono `CREATE TRIGGER IF NOT EXISTS` e non contengono istruzioni DELETE, UPDATE, DROP o INSERT sui dati dell'applicazione. Sono idempotenti: se un trigger esiste, non viene ricreato. I due file sono intenzionalmente separati per evitare problemi di parsing delle istruzioni `BEGIN ... END;` quando si incollano script multipli nella console D1.

### Risultato atteso

```text
D1 quizario-db: 14/14 tabelle, 14/14 indici, 5/5 trigger.
OK: schema D1 completo (controllo strutturale, senza modifiche).
```

Se il workflow fallisce, non ripetere la migrazione completa. Controlla l'errore preciso dell'azione di riparazione.

### Attenzione alla cronologia delle migrazioni

Il messaggio `d1_migrations assente` resterà eventualmente visibile perché il database è stato creato dalla console Cloudflare. **Questa riparazione non allinea il registro delle migrazioni**, che richiede un passaggio separato di verifica prima di eseguire `wrangler d1 migrations apply --remote`. Non scrivere righe manualmente in `d1_migrations`.