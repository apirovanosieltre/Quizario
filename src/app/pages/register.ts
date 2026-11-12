import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { TurnstileComponent } from '../shared/turnstile';
import { apiErrorMessage } from '../core/errors';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, TurnstileComponent],
  template: `
    <section class="container auth-layout">
      <div class="auth-side"><div class="eyebrow">ENTRA NEL CLUB</div><h1>Il prossimo<br><em>campione?</em></h1><p>Potresti essere tu. Crea il tuo profilo per accedere alle prossime funzionalità.</p><div class="auth-decor">✦</div></div>
      <div class="form-card"><div class="form-icon">✳</div><h2>Unisciti a Quizario</h2><p>Servono solo pochi dati per cominciare.</p>
        <form #form="ngForm" (ngSubmit)="submit()">
          <label for="nickname">Nickname <span class="info-small" title="2–24 caratteri: lettere, numeri, spazi, punti, trattini e underscore">ⓘ</span></label><input id="nickname" type="text" name="nickname" [(ngModel)]="nickname" autocomplete="nickname" placeholder="Come vuoi farti chiamare?" required minlength="2" maxlength="24">
          <label for="email">Email <span class="info-small" title="Usa un indirizzo valido. Sarà usato per accedere.">ⓘ</span></label><input id="email" type="email" name="email" [(ngModel)]="email" autocomplete="email" placeholder="nome@esempio.it" required email maxlength="254">
          <label for="password">Password <span class="info-small" title="Da 10 a 128 caratteri. Usa una password unica.">ⓘ</span></label>
          <div class="password-field"><input id="password" [type]="showPassword() ? 'text' : 'password'" name="password" [(ngModel)]="password" autocomplete="new-password" placeholder="Minimo 10 caratteri" required minlength="10" maxlength="128"><button type="button" [attr.aria-label]="showPassword() ? 'Nascondi password' : 'Mostra password'" (click)="showPassword.set(!showPassword())">{{ showPassword() ? 'Nascondi' : 'Mostra' }}</button></div>
          <label for="confirm">Conferma password</label><input id="confirm" [type]="showPassword() ? 'text' : 'password'" name="confirm" [(ngModel)]="confirm" autocomplete="new-password" placeholder="Ripeti la password" required>
          <label class="checkbox-line"><input type="checkbox" name="accepted" [(ngModel)]="accepted" required><span>Ho letto l’<a routerLink="/privacy" target="_blank" rel="noopener">informativa privacy</a>.</span></label>
          @if (securityLoading()) {<p role="status">Preparazione controllo anti-bot...</p>}
          @else if (!siteKey()) {<p class="form-error" role="alert">La registrazione non è ancora disponibile. Configurare Turnstile su Cloudflare.</p>}
          @else {<app-turnstile [siteKey]="siteKey()!" action="register" (tokenChange)="turnstileToken=$event" />}
          @if (error()) {<div role="alert" class="form-error">{{ error() }}</div>}
          <button type="submit" class="button button-primary full-button" [disabled]="busy() || !form.valid || !accepted || password !== confirm || !turnstileToken || !siteKey()">{{ busy() ? 'Creazione account…' : 'Crea account →' }}</button>
        </form>
        <p class="form-bottom">Hai già un account? <a routerLink="/login">Accedi</a></p>
      </div>
    </section>
  `,
})
export class RegisterPage implements OnInit {
  @ViewChild(TurnstileComponent) private turnstile?:TurnstileComponent;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected nickname = '';
  protected email = '';
  protected password = '';
  protected confirm = '';
  protected accepted = false;
  protected turnstileToken = '';
  protected readonly siteKey = signal<string|null>(null);
  protected readonly securityLoading = signal(true);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);

  ngOnInit():void {void this.loadSecurity();}
  private async loadSecurity():Promise<void>{
    try {const cfg=await this.auth.securityConfig();this.siteKey.set(cfg.registrationEnabled?cfg.turnstileSiteKey:null);}
    catch{this.error.set('Impossibile verificare la configurazione di sicurezza.');}
    finally{this.securityLoading.set(false);}
  }

  protected async submit(): Promise<void> {
    if (this.busy() || !this.siteKey() || !this.turnstileToken) return;
    if (this.password !== this.confirm) { this.error.set('Le password non coincidono.'); return; }
    if (!this.accepted) { this.error.set('Leggi l’informativa privacy per proseguire.'); return; }
    this.busy.set(true); this.error.set('');
    try { await this.auth.register(this.nickname, this.email, this.password, this.turnstileToken); await this.router.navigateByUrl('/account'); }
    catch (error) { this.error.set(apiErrorMessage(error)); this.turnstile?.reset(); }
    finally { this.busy.set(false); }
  }
}