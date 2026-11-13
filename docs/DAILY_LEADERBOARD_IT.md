# Quizario · Classifica giornaliera

## Come funziona

- La sfida giornaliera usa 10 domande uguali per tutti e un singolo tentativo per account.
- Ranking pubblico dei migliori **20** partecipanti: punteggio decrescente, poi durata in secondi crescente. In caso di ulteriore parità, primo completamento e ID interno stabilizzano l'ordinamento. La posizione individuale viene restituita anche oltre il 20° posto.
- **Solo risultati server-verified** in `quiz_results`, `quiz_slug='daily'`, con data Europe/Rome odierna; nessun punteggio inviato dal client è accettato.
- Per tutti, inclusi gli ospiti: la pagina `/classifica` mostra il ranking.
- Per apparire pubblicamente, serve account e **consenso opt-in esplicito** sulla pagina classifica; valore predefinito disattivato.
- Revocando il consenso, il record opt-in viene cancellato e il giocatore esce dal ranking, senza cancellare i risultati privati del profilo.
- Nel ranking si vedono solo pseudonimo derivato dall'ID casuale dell'account + data, punti e tempo; **mai nome, email, UUID o nickname**. Lo pseudonimo cambia ogni giorno e non è una protezione assoluta contro la re-identificazione in comunità piccole.
- La preferenza è cancellata con l'account tramite FK `ON DELETE CASCADE`.
- Il consenso copre il risultato di oggi e i successivi finché non viene revocato. Al momento del login, il giocatore può scegliere di partecipare anche a sfida già completata.

## D1 e pubblicazione

Il nuovo schema richiede **solo una tabella** `daily_leaderboard_opt_ins` con chiave primaria `user_id`; non duplica i punteggi.

Al merge in `main`, GitHub Actions avvia `Setup daily leaderboard consent in D1`, che usa i secrets già esistenti nell'ambiente `Environments`. Il job controlla le 14 tabelle principali, i trigger, verifica l'idempotenza SQLite, applica `migrations/0004_daily_leaderboard.sql` con `wrangler d1 execute --remote`, poi verifica la tabella in D1.

L'operazione è ripetibile. Poiché `d1_migrations` è assente sul database creato manualmente, questo file è eseguito **direttamente**, non tramite `wrangler d1 migrations apply`. Allineare lo storico delle migrazioni in una manutenzione separata. Nessun deploy Worker automatico viene eseguito.

Controllo manuale D1 (sola lettura):

```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='daily_leaderboard_opt_ins';
SELECT COUNT(*) AS iscritti FROM daily_leaderboard_opt_ins;
```

## Privacy e limiti

Prima di aprire le registrazioni al pubblico, finalizzare l'informativa GDPR, identificare il titolare e verificare i fornitori; la pagina privacy del repository contiene ancora un avviso di revisione.

Non attivare automaticamente l'iscrizione e non esporre email o nickname nel payload del ranking. Il servizio di rate limiting Workers già configurato si applica anche ai nuovi endpoint `/api/quiz/daily/leaderboard`.

Gli ospiti non partecipano al ranking perché i risultati locali non identificano account e non sono una base attendibile per una classifica globale. Il numero di partecipanti e le posizioni riflettono soltanto chi ha scelto di comparire.
