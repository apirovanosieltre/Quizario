import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { apiErrorMessage } from '../core/errors';
import { QuizApiService, type DailyLeaderboard } from '../core/quiz-api.service';

@Component({
  standalone:true,
  imports:[RouterLink],
  template:`
    <section class="container leaderboard-page">
      <a routerLink="/" class="back-link">← Torna ai quiz</a>
      <div class="eyebrow secondary">LA SFIDA DI OGGI</div>
      <h1>Classifica giornaliera <span aria-hidden="true">✦</span></h1>
      <p class="leaderboard-intro">Un solo quiz al giorno, dieci domande uguali per tutti.
        Vince chi ottiene più punti. A parità di punteggio conta il tempo migliore.</p>
      @if (loading()) {
        <p role="status">Caricamento classifica…</p>
      } @else if (error()) {
        <p role="alert" class="form-error">{{error()}}</p>
        <button class="button button-ghost" type="button" (click)="load()">Riprova</button>
      } @else if (board(); as data) {
        <div class="leaderboard-summary">
          <span>◈ {{data.today}}</span>
          <span>{{data.participants}} {{data.participants===1?'partecipante':'partecipanti'}}</span>
          <button class="text-action" type="button" (click)="load()">Aggiorna ↻</button>
        </div>
        @if (data.viewerRank; as me) {
          <div class="leaderboard-own-rank" role="status">
            <div><span>LA TUA POSIZIONE</span><strong>#{{me.rank}}</strong></div>
            <div><span>IL TUO RISULTATO</span><strong>{{me.score}}/{{me.total}} · {{time(me.durationSeconds)}}</strong></div>
          </div>
        }
        <div class="leaderboard-list" aria-label="Migliori venti risultati di oggi">
          <div class="leaderboard-list-heading"><h2>Top 20 di oggi</h2><span>Punti · Tempo</span></div>
          @if (data.entries.length===0) {
            <div class="leaderboard-empty">
              <span aria-hidden="true">✳</span>
              <h3>Ancora nessun risultato in classifica</h3>
              <p>La classifica si riempirà quando i giocatori registrati che hanno scelto di partecipare completeranno la sfida.</p>
            </div>
          } @else {
            <ol class="leaderboard-ranking">
              @for (entry of data.entries; track entry.rank) {
                <li [class.is-me]="entry.isMe" [class.is-podium]="entry.rank<=3">
                  <span class="leaderboard-rank" [attr.aria-label]="'Posizione '+entry.rank">
                    {{entry.rank===1?'🥇':entry.rank===2?'🥈':entry.rank===3?'🥉':'#'+entry.rank}}
                  </span>
                  <span class="leaderboard-alias">{{entry.alias}} @if (entry.isMe) {<em>Tu</em>}</span>
                  <span class="leaderboard-points">{{entry.score}}/{{entry.total}}</span>
                  <span class="leaderboard-time">{{time(entry.durationSeconds)}}</span>
                </li>
              }
            </ol>
          }
        </div>
        <div class="leaderboard-consent">
          <div class="eyebrow secondary">PARTECIPAZIONE FACOLTATIVA</div>
          <h2>Vuoi comparire in classifica?</h2>
          <p>La partecipazione è <strong>disattivata per impostazione predefinita</strong>.
            Vengono pubblicati solo punteggio, tempo e uno pseudonimo diverso ogni giorno.
            Email e nickname non sono mostrati. Puoi uscire in qualsiasi momento.</p>
          @if (data.signedIn) {
            <button type="button" class="button" [class.button-primary]="!data.viewerOptedIn"
              [class.button-ghost]="data.viewerOptedIn" [disabled]="saving()"
              (click)="toggleConsent(!data.viewerOptedIn)">
              {{saving()?'Aggiornamento…':data.viewerOptedIn?'Esci dalla classifica':'Partecipa alla classifica'}}
            </button>
            <p class="leaderboard-consent-state" role="status">
              {{data.viewerOptedIn?'✓ Partecipazione attiva. Puoi revocarla quando vuoi.':'Partecipazione disattivata: i tuoi risultati restano privati.'}}
            </p>
          } @else {
            <a class="button button-primary" routerLink="/login">Accedi per partecipare ↗</a>
            <p class="helper-note">Puoi consultare la classifica senza account. I quiz completati come ospite non partecipano al ranking.</p>
          }
          @if (saveError()) {<p class="form-error" role="alert">{{saveError()}}</p>}
        </div>
        <div class="leaderboard-footer">
          <a class="button button-primary" routerLink="/quiz/daily">Vai alla sfida di oggi ↗</a>
          <a class="button button-ghost" routerLink="/" fragment="categorie">Prova i quiz liberi</a>
        </div>
      }
    </section>
  `,
})
export class LeaderboardPage implements OnInit {
  private readonly api=inject(QuizApiService);
  private readonly auth=inject(AuthService);
  protected readonly board=signal<DailyLeaderboard|null>(null);
  protected readonly loading=signal(true);
  protected readonly saving=signal(false);
  protected readonly error=signal('');
  protected readonly saveError=signal('');

  ngOnInit():void {void this.load();}
  protected time(seconds:number):string {
    const total=Math.max(0,Math.round(seconds));
    return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
  }
  protected async load():Promise<void> {
    this.loading.set(true);this.error.set('');
    try{
      await this.auth.bootstrap();
      this.board.set(await this.api.dailyLeaderboard());
    }catch(error){this.error.set(apiErrorMessage(error));}
    finally{this.loading.set(false);}
  }
  protected async toggleConsent(enabled:boolean):Promise<void> {
    if(this.saving()||!this.auth.user())return;
    this.saving.set(true);this.saveError.set('');
    try{
      await this.api.setLeaderboardConsent(enabled);
      this.board.set(await this.api.dailyLeaderboard());
    }catch(error){this.saveError.set(apiErrorMessage(error));}
    finally{this.saving.set(false);}
  }
}
