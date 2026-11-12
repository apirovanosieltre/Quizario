import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="container legal-page"><a routerLink="/" class="back-link">← Home</a><div class="eyebrow secondary">TRASPARENZA</div><h1>Informazioni sulla privacy</h1>
      <div class="legal-alert"><strong>Documento provvisorio per lo starter tecnico.</strong> Prima di pubblicare il sito e consentire registrazioni reali, sostituire questa pagina con un’informativa completa verificata, inserendo titolare, contatti, base giuridica, fornitori e tempi effettivi di conservazione.</div>
      <h2>Quali dati gestisce questa versione?</h2><p>Se ti registri, vengono elaborati nickname, email, hash della password (non la password in chiaro), data di creazione dell’account e sessioni di accesso. La sessione ha scadenza massima di 30 giorni.</p>
      <h2>Risultati dei quiz</h2><p>I punteggi riepilogativi delle partite vengono conservati nel <strong>localStorage</strong> per le statistiche di questo dispositivo. Per gli utenti autenticati vengono inoltre salvati su D1 data, modalità, punteggio, totale e durata. Le risposte puntuali restano temporaneamente sul server nelle sessioni e vengono cancellate alla scadenza. I conteggi per difficoltà sono aggregati e i marcatori pseudonimi per evitare doppi conteggi scadono dopo 30 giorni.</p>
      <h2>Eliminazione account</h2><p>Nel profilo è disponibile la funzione di eliminazione, che rimuove l’account, le sessioni e gli eventuali risultati salvati nel database associati all’account. Le statistiche locali rimangono sul dispositivo finché non vengono eliminati dai dati del browser.</p>
      <h2>Cookie</h2><p>Viene utilizzato un cookie tecnico di sessione HttpOnly, Secure e SameSite=Lax per mantenere l’accesso. Non sono integrate pubblicità o cookie di profilazione in questo starter.</p>
      <p><a class="button button-primary" routerLink="/">Torna ai quiz</a></p>
    </section>
  `,
})
export class PrivacyPage {}
