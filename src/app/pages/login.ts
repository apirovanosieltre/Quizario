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
      <div class="auth-side"><div class="eyebrow">UN POSTO TUTTO TUO</div><h1>Si riparte<br><em>da qui.</em></h1><p>Accedi al tuo spazio Quizario. Le prossime sfide ti aspettano.</p><div class="auth-decor">✳</div></div>
      <div class="form-card"><div class="form-icon">◉</div><h2>Bentornato!</h2><p>Inserisci le tue credenziali per accedere.</p>
        <form #form="ngForm" (ngSubmit)="submit()">
          <label for="email">Indirizzo email</label><input id="email" type="email" name="email" [(ngModel)]="email" autocomplete="email" placeholder="nome@esempio.it" required email maxlength="254">
          <label for="password">Password</label>
          <div class="password-field"><input id="password" [type]="showPassword() ? 'text' : 'password'" name="password" [(ngModel)]="password" autocomplete="current-password" required placeholder="La tua password"><button type="button" [attr.aria-label]="showPassword() ? 'Nascondi password' : 'Mostra password'" (click)="showPassword.set(!showPassword())">{{ showPassword() ? 'Nascondi' : 'Mostra' }}</button></div>
          @if (error()) {<div role="alert" class="form-error">{{ error() }}</div>}
          <button type="submit" class="button button-primary full-button" [disabled]="busy() || !form.valid">{{ busy() ? 'Accesso in corso…' : 'Accedi →' }}</button>
        </form>
        <p class="form-bottom">Non hai ancora un account? <a routerLink="/register">Registrati</a></p>
      </div>
    </section>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected email = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly showPassword = signal(false);

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    this.error.set(''); this.busy.set(true);
    try { await this.auth.login(this.email, this.password); await this.router.navigateByUrl('/account'); }
    catch (error) { this.error.set(apiErrorMessage(error)); }
    finally { this.busy.set(false); }
  }
}
