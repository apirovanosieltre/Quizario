# Quizario · Fase 1: archivio domande, revisione e PWA

## Pannello `/admin`

Riservato agli utenti autenticati le cui email sono presenti in `ADMIN_EMAILS` (variabile privata del Worker). Il server ripete il controllo di autorizzazione su ogni endpoint; l'interfaccia non concede permessi.

- Schede **Bozze / Da verificare / Pubblicate / Rifiutate**; riepilogo per stato.
- Filtri in D1 per categoria, difficoltà editoriale e ricerca per testo o ID della fonte; 20 elementi per pagina, massimo server-side 50. Nessun caricamento dell'intero archivio nel browser.
- Segnalazione di possibili duplicati con testo identico normalizzato (`LOWER(TRIM(prompt))`). È un controllo **approssimato**: domande formulate diversamente sullo stesso fatto possono non risultare duplicate. La verifica umana resta necessaria.
- Nelle bozze o nelle domande in revisione: **Modifica** domanda, spiegazione, fonte HTTPS, quattro alternative, risposta corretta, categoria e difficoltà. Il salvataggio rende sempre la domanda `draft`, azzera `verified_at` e incrementa `revision`. Concorrenza gestita con controllo `revision` sul server e update atomico D1, senza modificare direttamente domande pubblicate.
- Azioni di massa: fino a 20 domande per volta **In revisione** o **Rifiuta**. Per sicurezza **non esiste una pubblicazione di massa**: ogni domanda va pubblicata manualmente dopo aver controllato fonte e risposte.
- Se una domanda pubblicata contiene un errore, non modificarla direttamente: può essere già usata da sessioni o sfide giornaliere in corso. Pianificare una funzione versionata di archiviazione/correzione prima del lancio.

Le nuove API non richiedono modifiche alla struttura D1 già verificata. La tabella `d1_migrations` può ancora essere assente perché in origine lo schema fu creato manualmente: non risolvere applicando ciecamente tutte le migrazioni in produzione.

## Più domande senza contenuti non verificati

La pipeline di bozze supporta queste ricette Wikidata (licenza CC0):

| Ricetta | Categoria | Domanda |
| --- | --- | --- |
| `capitals` | Geografia | Capitale di uno Stato |
| `currencies` | Geografia | Valuta associata a uno Stato |
| `elements` | Scienza | Elemento associato al numero atomico |
| `symbols` | Scienza | Simbolo chimico di un elemento |

`opentdb` resta utilizzabile solo per bozze in inglese, da tradurre e revisionare secondo i vincoli di attribuzione e ShareAlike.

Le nuove ricette usano le proprietà Wikidata P38 (valuta), P1086 (numero atomico) e P246 (simbolo chimico). I dati possono essere ambigui, storici o contestati; la pipeline scarta entità con più valori incompatibili nel risultato, ma **non sostituisce la verifica manuale**. Le nuove domande hanno sempre `status='draft'`. L'importazione ripetuta non deve sovrascrivere le correzioni editoriali effettuate sulle bozze esistenti.

L'azione GitHub **Prepare open-data quiz drafts (no D1 writes)** crea settimanalmente SQL di bozze dalle quattro ricette. La generazione non importa automaticamente in D1. Per importazioni effettive, esegui **Import Wikidata D1 drafts (manual, review required)**, selezionando ricetta e numero massimo; l'azione verifica prima lo schema D1. Qualsiasi import reale richiede autorizzazione e controllo manuale delle domande prima della pubblicazione.

## PWA già presente

La PWA era prevista già nella v0.3: manifest `public/manifest.webmanifest` con `display=standalone`, icone per i launcher e Apple touch icon, service worker Angular registrato in produzione e risorse applicazione configurate per la cache in `ngsw-config.json`. È installabile da browser compatibili una volta distribuita su HTTPS e collaudata.

Questa fase aggiunge una barra offline quando il dispositivo segnala assenza di rete. La UI shell può essere disponibile dalla cache dopo il primo caricamento online, **ma quiz liberi e sfida giornaliera non sono giocabili offline**: la scelta delle domande e la verifica delle risposte avvengono sul server. `navigator.onLine` è solo un indicatore locale: una connessione attiva non garantisce che l'API sia raggiungibile.

### Prima di distribuire

1. Completare il collaudo di sicurezza e Turnstile/recupero password come da `docs/SECURITY_LAUNCH_IT.md`.
2. Finalizzare l'informativa privacy, il titolare e i contatti, la conservazione e la gestione di dati tecnici e cookie.
3. Testare installazione PWA e aggiornamento del service worker su iPhone Safari e Android Chrome, inclusi errori di rete e ritorno online.
4. Verificare che almeno 3 domande facili, 4 medie e 3 difficili siano realmente **pubblicate** per la sfida giornaliera, poi aumentare il bacino per ridurre le ripetizioni.
5. Allineare con cautela la cronologia `d1_migrations` prima di cambiare lo schema D1.

Nessuna nuova migrazione D1 e nessuna pubblicazione automatica di domande previste in questa fase.