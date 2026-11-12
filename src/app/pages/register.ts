import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { apiErrorMessage } from '../core/errors';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
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
          @if (error()) {<div role="alert" class="form-error">{{ error() }}</div>}
          <button type="submit" class="button button-primary full-button" [disabled]="busy() || !form.valid || !accepted || password !== confirm">{{ busy() ? 'Creazione account…' : 'Crea account →' }}</button>
        </form>
        <p class="form-bottom">Hai già un account? <a routerLink="/login">Accedi</a></p>
      </div>
    </section>
  `,
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected nickname = '';
  protected email = '';
  protected password = '';
  protected confirm = '';
  protected accepted = false;
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    if (this.password !== this.confirm) { this.error.set('Le password non coincidono.'); return; }
    if (!this.accepted) { this.error.set('Leggi l’informativa privacy per proseguire.'); return; }
    this.busy.set(true); this.error.set('');
    try { await this.auth.register(this.nickname, this.email, this.password); await this.router.navigateByUrl('/account'); }
    catch (error) { this.error.set(apiErrorMessage(error)); }
    finally { this.busy.set(false); }
  }
}
