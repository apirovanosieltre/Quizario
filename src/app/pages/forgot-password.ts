import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { apiErrorMessage } from '../core/errors';
import { TurnstileComponent } from '../shared/turnstile';

@Component({
  standalone:true,
  imports:[FormsModule,RouterLink,TurnstileComponent],
  template:`
    <section class="container auth-layout">
      <div class="auth-side"><div class="eyebrow">ACCESSO ALL'ACCOUNT</div><h1>Recupera<br><em>la password.</em></h1><p>Il link scade dopo 30 minuti. Se non riconosci la richiesta, ignora l'email.</p></div>
      <div class="form-card"><h2>Password dimenticata?</h2>
        <p>Inserisci l'indirizzo associato all'account. Riceverai le istruzioni, se l'indirizzo è registrato.</p>
        @if (sent()) {
          <p class="form-notice" role="status">Se l'indirizzo è registrato, riceverai un messaggio con le istruzioni.</p>
        } @else {
          <form #form="ngForm" (ngSubmit)="submit()">
            <label for="forgot-email">Email</label>
            <input id="forgot-email" name="email" type="email" [(ngModel)]="email" autocomplete="email" required email maxlength="254">
            @if (configLoading()) {<p role="status">Verifica del servizio...</p>}
            @else if (!siteKey()) {<p class="form-error" role="alert">Il recupero password non è ancora configurato.</p>}
            @else {<app-turnstile [siteKey]="siteKey()!" action="recover" (tokenChange)="token=$event" />}
            @if (error()) {<p role="alert" class="form-error">{{error()}}</p>}
            <button type="submit" class="button button-primary full-button" [disabled]="busy() || !form.valid || !siteKey() || !token">{{busy()?'Invio in corso...':'Invia link di recupero'}}</button>
          </form>
        }
        <p class="form-bottom"><a routerLink="/login">← Torna al login</a></p>
      </div>
    </section>
  `,
})
export class ForgotPasswordPage implements OnInit {
  private readonly auth=inject(AuthService);
  @ViewChild(TurnstileComponent) private turnstile?:TurnstileComponent;
  protected email='';
  protected token='';
  protected readonly siteKey=signal<string|null>(null);
  protected readonly configLoading=signal(true);
  protected readonly error=signal('');
  protected readonly busy=signal(false);
  protected readonly sent=signal(false);
  ngOnInit():void{void this.loadConfig();}
  private async loadConfig():Promise<void>{
    try {const config=await this.auth.securityConfig();this.siteKey.set(config.passwordResetEnabled?config.turnstileSiteKey:null);}
    catch {this.error.set('Impossibile verificare la disponibilità del servizio.');}
    finally {this.configLoading.set(false);}
  }
  protected async submit():Promise<void>{
    if(this.busy() || !this.token || !this.siteKey())return;
    this.busy.set(true);this.error.set('');
    try {await this.auth.requestPasswordReset(this.email,this.token);this.sent.set(true);}
    catch(e){this.error.set(apiErrorMessage(e));this.turnstile?.reset();}
    finally {this.busy.set(false);}
  }
}