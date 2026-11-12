import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { apiErrorMessage } from '../core/errors';

@Component({
  standalone:true,
  imports:[FormsModule,RouterLink],
  template:`
    <section class="container auth-layout">
      <div class="auth-side"><div class="eyebrow">NUOVA PASSWORD</div><h1>Riparti<br><em>in sicurezza.</em></h1><p>Dopo la modifica, tutte le sessioni precedenti verranno chiuse.</p></div>
      <div class="form-card"><h2>Imposta una nuova password</h2>
        @if (done()) {<p class="form-notice" role="status">Password aggiornata. Ora puoi accedere nuovamente.</p><a class="button button-primary full-button" routerLink="/login">Vai al login</a>}
        @else if (!token) {<p class="form-error" role="alert">Link mancante o non valido. Richiedine uno nuovo.</p><a routerLink="/forgot-password">Richiedi un nuovo link</a>}
        @else {
          <form #form="ngForm" (ngSubmit)="submit()">
            <label for="reset-password">Nuova password (10–128 caratteri)</label>
            <div class="password-field"><input id="reset-password" name="password" [type]="visible()?'text':'password'" [(ngModel)]="password" autocomplete="new-password" required minlength="10" maxlength="128"><button type="button" (click)="visible.set(!visible())">{{visible()?'Nascondi':'Mostra'}}</button></div>
            <label for="reset-confirm">Conferma password</label>
            <input id="reset-confirm" name="confirm" [type]="visible()?'text':'password'" [(ngModel)]="confirm" autocomplete="new-password" required>
            @if(error()){<p role="alert" class="form-error">{{error()}}</p>}
            <button type="submit" class="button button-primary full-button" [disabled]="busy()||!form.valid||password!==confirm">{{busy()?'Aggiornamento...':'Aggiorna password'}}</button>
          </form>
        }
        <p class="form-bottom"><a routerLink="/login">← Torna al login</a></p>
      </div>
    </section>
  `,
})
export class ResetPasswordPage implements OnInit {
  private readonly auth=inject(AuthService);
  protected token='';
  protected password='';
  protected confirm='';
  protected readonly visible=signal(false);
  protected readonly busy=signal(false);
  protected readonly done=signal(false);
  protected readonly error=signal('');
  ngOnInit():void{
    const fragment=window.location.hash.slice(1);
    if(fragment.startsWith('token='))this.token=decodeURIComponent(fragment.slice(6));
    // Immediately remove the secret from the address bar and browser history.
    if(fragment.startsWith('token='))window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
  }
  protected async submit():Promise<void>{
    if(!this.token || this.password!==this.confirm || this.busy())return;
    this.error.set('');this.busy.set(true);
    try {await this.auth.resetPassword(this.token,this.password);this.token='';this.done.set(true);}
    catch(e){this.error.set(apiErrorMessage(e));}
    finally{this.busy.set(false);}
  }
}