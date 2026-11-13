import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone:true,
  imports:[RouterLink],
  template:`
    <section class="container legal-page">
      <a routerLink="/" class="back-link">← Home</a>
      <div class="eyebrow secondary">PROTEZIONE DEI DATI</div><h1>Informativa privacy</h1>
      <div class="legal-alert"><strong>Informativa in revisione, sito non pronto per registrazioni pubbliche.</strong>
        Prima del lancio occorre indicare il titolare del trattamento, i contatti completi, la valutazione dei fornitori e dei trasferimenti internazionali, e approvare questa informativa.</div>
      <h2>Titolare e contatti</h2>
      <p><strong>Da completare prima del lancio:</strong> identità e recapito del titolare del trattamento, indirizzo per richieste privacy ed eventuale rappresentante o DPO (se applicabile).</p>
      <h2>Dati e finalità</h2>
      <p>Un account richiede nickname, indirizzo email e password. La password è conservata solo sotto forma di hash con salt; vengono registrate creazione e aggiornamento del profilo. Usiamo questi dati per fornire accesso, gestione dell'account e salvataggio dei risultati (art. 6, par. 1, lett. b del GDPR, in base al servizio offerto).</p>
      <p>Le sessioni e i controlli anti-abuso servono a proteggere il servizio. I limiti alle richieste operano tramite Cloudflare e non creano uno storico applicativo degli indirizzi IP su D1. Il trattamento per sicurezza richiede una valutazione della base giuridica e dell'interesse legittimo, ove applicabile.</p>
      <h2>Quiz e dati locali</h2>
      <p>I risultati sintetici associati agli account comprendono data, modalità, punteggio, totale e durata. Sul dispositivo si possono conservare statistiche in localStorage. Le risposte singole sono memorizzate temporaneamente nelle sessioni di gioco. Le statistiche aggregate di correttezza non contengono la cronologia nominativa delle risposte.</p>
      <h2>Classifica giornaliera facoltativa</h2>
      <p>La classifica pubblica usa esclusivamente risultati giornalieri verificati lato server degli account che hanno attivato volontariamente la partecipazione. Sono visibili posizione, punteggio, totale, tempo e uno pseudonimo pseudocasuale che cambia ogni giorno. Non vengono pubblicati email, nickname o identificativo dell'account.</p>
      <p>La partecipazione è disattivata per impostazione predefinita. Puoi attivarla e revocarla dalla pagina Classifica, in qualsiasi momento. Alla revoca i tuoi risultati scompaiono dalla classifica pubblica; restano disponibili soltanto nel tuo profilo secondo le normali regole di conservazione. La preferenza è cancellata insieme all'account.</p>
      <h2>Conservazione</h2>
      <p>Le sessioni di login durano al massimo 30 giorni. Le partite libere conservano i dati temporanei per circa 4 ore, quelle giornaliere fino al termine della giornata, salvo i dati riepilogativi dell'account. I marcatori pseudonimi anti-duplicazione per le statistiche scadono dopo 30 giorni. I link di recupero password scadono dopo 30 minuti e non vengono memorizzati come token permanenti nel database.</p>
      <p>Il profilo e i risultati restano finché l'account è attivo oppure fino all'eliminazione richiesta dall'utente; i dati tecnici dei fornitori possono seguire termini propri, da verificare e documentare prima del lancio.</p>
      <h2>Fornitori e sicurezza</h2>
      <p>Cloudflare gestisce hosting, database D1, Turnstile e controlli anti-abuso. Se viene attivato il recupero password via email, il servizio Resend elabora l'indirizzo del destinatario per la sola consegna del messaggio. Prima del lancio bisogna verificare accordi sul trattamento, localizzazione dei dati e gli eventuali trasferimenti extra SEE.</p>
      <h2>Cookie e contenuti di terzi</h2>
      <p>Quizario utilizza un cookie tecnico di autenticazione con attributi HttpOnly, Secure e SameSite=Lax. Turnstile esegue controlli anti-bot; la sua informativa e gli eventuali identificatori tecnici vanno considerati nella valutazione privacy. Questa versione non include pubblicità o cookie di profilazione dell'applicazione.</p>
      <h2>Diritti e richieste</h2>
      <p>Puoi chiedere accesso, rettifica, cancellazione, limitazione e portabilità dei dati, e opporti al trattamento nei casi previsti dal GDPR. Puoi cancellare l'account dal profilo; le statistiche locali restano finché non vengono rimosse dal browser. Puoi inoltre presentare reclamo al Garante per la protezione dei dati personali (<a href="https://www.garanteprivacy.it/" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>).</p>
      <p>La creazione dell'account è facoltativa: è possibile giocare anche senza registrarsi. Le richieste privacy dovranno essere indirizzate al recapito del titolare indicato nella versione finale di questa pagina.</p>
      <p><a class="button button-primary" routerLink="/">Torna ai quiz</a></p>
    </section>
  `,
})
export class PrivacyPage {}