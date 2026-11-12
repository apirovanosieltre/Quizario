import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ProgressService } from '../core/progress.service';
import { apiErrorMessage } from '../core/errors';
import { ResultsService, AccountResult } from '../core/results.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="container account-wrap">
      <div class="eyebrow secondary">IL MIO SPAZIO</div><h1>Il tuo profilo</h1>
      @if (auth.loading()) {
        <div class="profile-card"><p>Caricamento account…</p></div>
      } @else if (auth.user(); as user) {
        <div class="account-grid">
          <div class="profile-card">
            <div class="profile-avatar">{{ user.nickname.charAt(0).toUpperCase() }}</div><h2>{{ user.nickname }}</h2><p>{{ user.email }}</p><span class="profile-tag">Profilo attivo</span>
            <div class="profile-metrics"><div><strong>{{ progress.completed() }}</strong><span>Quiz su questo dispositivo</span></div><div><strong>{{ progress.average() }}%</strong><span>Media risposte esatte</span></div></div>
            <button class="button button-ghost full-button" type="button" [disabled]="busy()" (click)="logout()">Esci dall’account</button>
          </div>
          <div class="profile-card profile-edit"><h2>Impostazioni</h2><p>Personalizza il nome visualizzato.</p>
            <form (ngSubmit)="save()"><label for="new-nickname">Nickname</label><input id="new-nickname" name="nickname" [(ngModel)]="nickname" [placeholder]="user.nickname" minlength="2" maxlength="24" required><button class="button button-primary" type="submit" [disabled]="busy() || !nickname.trim()">Salva modifiche</button></form>
            @if (notice()) {<p class="form-notice" role="status">{{ notice() }}</p>}
            @if (error()) {<p class="form-error" role="alert">{{ error() }}</p>}
            <div class="danger-zone"><h3>Elimina account</h3><p>Elimina il tuo profilo e le sessioni. I risultati salvati sul server vengono eliminati con l’account. Le statistiche locali restano nel browser.</p><button type="button" class="danger-button" [disabled]="busy()" (click)="remove()">Elimina definitivamente l’account</button></div>
          </div>
        </div>
        <div class="account-results">
          <h2>Risultati salvati nel profilo</h2>
          @if (resultsLoading()) {<p>Caricamento risultati…</p>}
          @else if (results().length===0) {<p class="muted-copy">Nessun quiz completato con questo account.</p>}
          @else {
            <div class="results-table">
              @for (result of results(); track result.quiz_date+result.quiz_slug) {
                <div class="result-line"><span><strong>{{result.quiz_slug==='daily'?'Sfida giornaliera':'Quiz libero'}}</strong>
                  <small>{{result.quiz_date}} · {{result.quiz_slug}}</small></span>
                  <strong>{{result.score}}/{{result.total}}</strong>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="guest-panel"><div class="guest-symbol" aria-hidden="true">◉</div><h2>Ancora nessun profilo?</h2><p>Puoi già giocare senza registrarti. Con un account avrai un punto di partenza per le prossime funzionalità.</p><div class="result-actions"><a class="button button-primary" routerLink="/register">Crea un account ↗</a><a class="button button-ghost" routerLink="/login">Ho già un account</a></div></div>
      }
    </section>
  `,
})
export class AccountPage implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly progress = inject(ProgressService);
  private readonly router = inject(Router);
  private readonly resultsService=inject(ResultsService);
  protected readonly results=signal<AccountResult[]>([]);
  protected readonly resultsLoading=signal(false);
  ngOnInit():void{void this.loadResults();}
  private async loadResults(){
    this.resultsLoading.set(true);
    try{this.results.set(await this.resultsService.list());}catch{/* 401 is normal for guests */}
    finally{this.resultsLoading.set(false);}
  }
  protected nickname = '';
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal('');

  protected async save(): Promise<void> {
    if (this.busy()) return;
    this.error.set(''); this.notice.set(''); this.busy.set(true);
    try { await this.auth.changeNickname(this.nickname.trim()); this.notice.set('Nickname aggiornato.'); }
    catch (error) { this.error.set(apiErrorMessage(error)); }
    finally { this.busy.set(false); }
  }

  protected async logout(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    try { await this.auth.logout(); await this.router.navigateByUrl('/'); }
    catch (error) { this.error.set(apiErrorMessage(error)); }
    finally { this.busy.set(false); }
  }

  protected async remove(): Promise<void> {
    if (this.busy() || !window.confirm('Eliminare definitivamente l’account? Questa operazione non può essere annullata.')) return;
    this.busy.set(true); this.error.set('');
    try { await this.auth.deleteAccount(); await this.router.navigateByUrl('/'); }
    catch (error) { this.error.set(apiErrorMessage(error)); }
    finally { this.busy.set(false); }
  }
}
