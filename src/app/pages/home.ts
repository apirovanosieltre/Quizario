import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ProgressService } from '../core/progress.service';
import { DailyProgressService } from '../core/daily-progress.service';
import { QuizApiService, QuizCatalog } from '../core/quiz-api.service';
import { CATEGORY_STYLES } from '../data/categories';
import { apiErrorMessage } from '../core/errors';

@Component({
  standalone:true,
  imports:[RouterLink],
  template:`
    <section class="container hero">
      <div class="hero-copy">
        <div class="eyebrow"><span class="eyebrow-pulse"></span> IL TUO MOMENTO QUIZ</div>
        <h1>Allena la mente.<br><span class="highlight">Divertiti sul serio.</span></h1>
        <p>Domande sempre nuove, risposte verificate dal server. Scegli la difficoltà oppure partecipa alla sfida giornaliera uguale per tutti.</p>
        <div class="hero-actions">
          @if (daily.current()?.completed) {
            <a class="button button-primary" routerLink="/quiz/daily">✓ Sfida completata · {{daily.current()?.score}}/{{daily.current()?.total}}</a>
          } @else if (daily.current()) {
            <a class="button button-primary" routerLink="/quiz/daily">Sfida di oggi <span aria-hidden="true">↗</span></a>
          } @else {
            <span class="button button-primary daily-button-loading" role="status">Caricamento sfida…</span>
          }
          <a class="button button-ghost" href="#categorie">Esplora i quiz liberi ↓</a>
        </div>
        <div class="hero-pills"><span>✓ Gratuito</span><span>✓ Anche da PWA</span><span>✓ 3 difficoltà</span></div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="orbit orbit-outer"></div><div class="orbit orbit-inner"></div>
        <span class="floating-shape shape-star">✳</span><span class="floating-shape shape-dot">✦</span>
        <div class="hero-card"><div class="hero-card-top"><span>QUIZ DEL GIORNO</span><span class="hero-card-number">01 / 10</span></div>
          <div class="hero-card-icon">?</div><div class="hero-card-title">Quanto ne sai davvero?</div>
          <div class="hero-card-foot"><span>Dieci domande, una sfida</span><span>→</span></div>
        </div>
      </div>
    </section>
    <section class="container today-section"><div class="today-card" [class.today-completed]="daily.current()?.completed">
      <div class="today-icon" aria-hidden="true">{{daily.current()?.completed?'✓':'◈'}}</div>
      <div class="today-text">
        @if (daily.current()?.completed) {
          <div class="small-label">✓ COMPLETATA OGGI · {{daily.current()?.today}}</div>
          <h2>La sfida è conclusa: {{daily.current()?.score}}/{{daily.current()?.total}}</h2>
          <p>🔥 {{daily.current()?.streak}} {{daily.current()?.streak===1?'giorno':'giorni'}} di streak · Torna domani per una nuova sfida.</p>
          <p class="today-scope">Risultato {{daily.current()?.scope==='account'?'salvato nel profilo':'memorizzato su questo dispositivo'}}.</p>
        } @else if (daily.current()) {
          <div class="small-label">LA SFIDA DI OGGI · {{daily.current()?.today}}</div>
          <h2>Dieci domande, un solo tentativo</h2>
          <p>3 facili, 4 medie e 3 difficili. Le stesse per tutti.</p>
          @if (daily.current()?.streak) {
            <p class="today-streak-hint">🔥 Streak di {{daily.current()?.streak}} {{daily.current()?.streak===1?'giorno':'giorni'}}: gioca oggi per continuarla.</p>
          }
        } @else {
          <div class="small-label">LA SFIDA DI OGGI</div>
          <h2>Prepariamo il tuo risultato…</h2>
          <p>Controllo della sfida in corso.</p>
        }
      </div>
      <div class="today-actions">
        @if (daily.current()?.completed) {
          <a class="button button-light" href="#categorie">Prova altri quiz ↗</a>
          <a class="today-review-link" routerLink="/quiz/daily">Vedi risultato di oggi</a>
        } @else if (daily.current()) {
          <a class="button button-light" routerLink="/quiz/daily">Gioca ora ↗</a>
        } @else {
          <span class="button button-light daily-button-loading" role="status">Caricamento…</span>
        }
      </div>
    </div></section>
    <section class="container section" id="categorie">
      <div class="section-heading"><div><div class="eyebrow secondary">QUIZ LIBERO</div><h2>Qual è il tuo forte?</h2></div>
        <p>Scegli categoria, numero di domande e difficoltà. Le risposte corrette vengono rivelate solo dopo aver giocato.</p></div>
      @if (error()) { <p role="alert" class="form-error">{{error()}} <button class="text-action" (click)="load()">Riprova</button></p> }
      <div class="category-grid">
        @for (item of cards(); track item.slug) {
          @if (item.total>=5) {
            <a class="category-card" [class]="'category-card tint-'+item.tint" [routerLink]="['/quiz',item.slug]">
              <span class="category-illustration" aria-hidden="true">{{item.emoji}}</span>
              <span class="category-label">{{item.label}}</span><strong>{{item.title}}</strong>
              <span class="category-desc">{{item.description}}</span>
              <span class="category-bottom"><span>{{item.total}} domande disponibili</span><span class="category-arrow">↗</span></span>
            </a>
          } @else {
            <div class="category-card category-disabled" [class]="'category-card tint-'+item.tint">
              <span class="category-illustration" aria-hidden="true">{{item.emoji}}</span>
              <span class="category-label">{{item.label}}</span><strong>{{item.title}}</strong>
              <span class="category-desc">{{item.description}}</span>
              <span class="category-bottom"><span>In preparazione · {{item.total}} domande</span></span>
            </div>
          }
        }
      </div>
    </section>
    <section class="container section stats-section">
      <div class="section-heading"><div><div class="eyebrow secondary">IL TUO PERCORSO</div><h2>Ogni risposta conta.</h2></div></div>
      <div class="stats-grid">
        <div class="stat-card"><span class="stat-symbol">◈</span><strong>{{progress.completed()}}</strong><span>Quiz conclusi su questo dispositivo</span></div>
        <div class="stat-card"><span class="stat-symbol">✳</span><strong>{{progress.average()}}%</strong><span>Risposte corrette in media</span></div>
        <div class="stat-card stat-card-cta"><strong>Pronto per un'altra sfida?</strong><span>{{auth.user()?'I punteggi delle nuove partite vengono verificati dal server.':'Puoi giocare come ospite o creare un profilo.'}}</span><a routerLink="/account">Vai al profilo ↗</a></div>
      </div>
      <p class="helper-note">Queste statistiche sono locali. Le nuove partite vengono validate dal server; accedi prima di giocare per conservarne il risultato nell'account.</p>
    </section>
  `
})
export class HomePage implements OnInit {
  protected readonly auth=inject(AuthService);
  protected readonly progress=inject(ProgressService);
  protected readonly daily=inject(DailyProgressService);
  private readonly api=inject(QuizApiService);
  protected readonly catalog=signal<QuizCatalog|null>(null);
  protected readonly error=signal('');
  protected readonly cards=computed(()=>CATEGORY_STYLES.map(style=>{
    const fromDb=this.catalog()?.categories.find(c=>c.slug===style.slug);
    return {...style,total:fromDb?.total??0,label:fromDb?.label??style.title};
  }));
  ngOnInit(){void this.load();void this.daily.refresh();}
  protected async load(){try{this.error.set('');this.catalog.set(await this.api.catalog());}catch(e){this.error.set(apiErrorMessage(e));}}
}
