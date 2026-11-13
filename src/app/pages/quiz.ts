import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DailyProgressService } from '../core/daily-progress.service';
import { AuthService } from '../core/auth.service';
import { bestComparableAttempt, beatsPreviousBest, ProgressService, type QuizAttempt } from '../core/progress.service';
import { apiErrorMessage } from '../core/errors';
import { Difficulty, QuizAnswer, QuizApiService, QuizSession, type QuizReview } from '../core/quiz-api.service';
import { CATEGORY_STYLES } from '../data/categories';

@Component({
  standalone:true,
  imports:[RouterLink],
  template:`
    <section class="container quiz-wrap">
      <a class="back-link" routerLink="/">← Torna alle categorie</a>
      <div class="quiz-head"><div class="eyebrow secondary">{{isDaily?'SFIDA GIORNALIERA':'QUIZ LIBERO'}} · RISPOSTE VERIFICATE</div>
        <h1>{{title}}</h1><p>{{isDaily?'Le stesse 10 domande per tutti, in ordine di difficoltà.':description}}</p>
      </div>
      @if (error()) { <div class="form-error" role="alert">{{error()}}
        @if (session()) { <button class="text-action" type="button" (click)="restore()">Risincronizza partita</button> }
      </div> }
      @if (loading()) {
        <div class="question-card"><p role="status">Caricamento delle domande...</p></div>
      } @else if (!session() && !isDaily) {
        <div class="question-card setup-card">
          <h2>Personalizza il tuo quiz</h2><p class="muted-copy">Domande reali prelevate dal nostro archivio. Puoi scegliere la difficoltà o mescolare i livelli.</p>
          <div class="setup-grid">
            <label>Difficoltà
              <select [value]="difficulty()" (change)="changeDifficulty($event)">
                <option value="mixed">Mista</option><option value="easy">Facile</option>
                <option value="medium">Media</option><option value="hard">Difficile</option>
              </select>
            </label>
            <label>Numero di domande
              <select [value]="count()" (change)="changeCount($event)">
                <option value="5">5 domande</option><option value="10">10 domande</option><option value="15">15 domande</option>
              </select>
            </label>
          </div>
          <button class="button button-primary full-button" type="button" (click)="start()">Comincia la partita →</button>
        </div>
      } @else if (!session() && isDaily) {
        @if (daily.current()?.completed) {
          <div class="result-card daily-already-completed" role="status">
            <div class="daily-done-icon" aria-hidden="true">✓</div>
            <div class="eyebrow secondary">SFIDA DEL GIORNO COMPLETATA</div>
            <h2>Ottimo, per oggi hai finito!</h2>
            <p>Il quiz giornaliero si rinnova domani. Nel frattempo hai altri quiz da esplorare.</p>
            <div class="daily-completed-metrics">
              <div><span>Risultato di oggi</span><strong>{{daily.current()?.score}}/{{daily.current()?.total}}</strong></div>
              <div><span>Streak attuale</span><strong>🔥 {{daily.current()?.streak}} {{daily.current()?.streak===1?'giorno':'giorni'}}</strong></div>
            </div>
            <p class="daily-scope-note">{{daily.current()?.scope==='account'?'Risultato verificato e conservato nel profilo.':'Risultato conservato su questo dispositivo.'}}</p>
            <a class="button button-ghost" routerLink="/classifica">♛ Vedi la classifica di oggi ↗</a>
            <a class="button button-primary" routerLink="/" fragment="categorie">Scopri gli altri quiz ↗</a>
            <a class="daily-return-home" routerLink="/">Torna alla homepage</a>
          </div>
        } @else if (daily.error()) {
          <div class="question-card"><h2>Impossibile verificare la sfida</h2>
            <p>{{daily.error()}}</p><button class="button button-primary" type="button" (click)="retryDaily()">Riprova verifica</button>
          </div>
        } @else if (daily.current()) {
          <div class="question-card"><h2>La sfida non è disponibile</h2><p>{{error() || 'Non è stato possibile caricare le domande.'}}</p>
            <button class="button button-primary" type="button" (click)="start()">Riprova</button>
            <a class="button button-ghost" routerLink="/" fragment="categorie">Prova un altro quiz</a>
          </div>
        } @else {
          <div class="question-card"><p role="status">Verifica del risultato giornaliero in corso…</p></div>
        }
      } @else if (session(); as game) {
        @if (!finished()) {
          <div class="question-card">
            <div class="question-meta"><span>DOMANDA {{index()+1}} DI {{game.questions.length}}</span>
              <span>{{score()}} {{score()===1?'punto':'punti'}}</span></div>
            <div class="progress-track" role="progressbar" [attr.aria-valuenow]="index()+1" [attr.aria-valuemin]="1"
              [attr.aria-valuemax]="game.questions.length" aria-label="Avanzamento quiz">
              <div [style.width.%]="((index()+1)/game.questions.length)*100"></div></div>
            <div class="difficulty-label">{{difficultyName(game.questions[index()].difficulty)}}</div>
            <h2>{{game.questions[index()].prompt}}</h2>
            <div class="answers">
              @for (option of game.questions[index()].options; track $index) {
                <button type="button" class="answer" [class.selected]="selected()===$index"
                  [class.correct]="reveal()!==null && reveal()?.correctOptionIndex===$index"
                  [class.wrong]="reveal()!==null && selected()===$index && !reveal()?.isCorrect"
                  [disabled]="busy() || reveal()!==null" (click)="choose($index)">
                  <span class="answer-letter">{{letters[$index]}}</span><span>{{option}}</span>
                  @if (reveal()!==null && reveal()?.correctOptionIndex===$index) {<span class="answer-check" aria-label="Risposta corretta">✓</span>}
                </button>
              }
            </div>
            @if (busy()) {<p role="status" class="helper-note">Verifica della risposta...</p>}
            @if (reveal(); as result) {
              <div class="explanation" role="status"><strong>{{result.isCorrect?'Corretto!':'Risposta non corretta.'}}</strong> {{result.explanation}}</div>
              <button type="button" class="button button-primary next-button" (click)="next()">
                {{result.completed?'Mostra il risultato':'Prossima domanda'}} →
              </button>
            }
          </div>
        } @else {
          <div class="result-card result-card-expanded" aria-live="polite">
            <div class="result-sparkles" aria-hidden="true"><span>✳</span><span>✦</span><span>◈</span></div>
            <div class="eyebrow secondary">{{isDaily?'SFIDA DEL GIORNO COMPLETATA':'QUIZ COMPLETATO'}}</div>
            <h2>{{resultHeading()}}</h2>
            <p class="result-subtitle">{{resultMessage()}}</p>
            <div class="result-score-ring" [style.--score-percentage]="percent()+'%'"
              [attr.aria-label]="'Risposte esatte: '+score()+' su '+game.questions.length+', '+percent()+' per cento'">
              <div class="result-score-core">
                <span class="result-score-percent">{{percent()}}%</span>
                <span class="result-score-caption">{{score()}} / {{game.questions.length}} corrette</span>
              </div>
            </div>
            <div class="result-metrics" aria-label="Statistiche della partita">
              <div><strong>{{score()}}</strong><span>Corrette</span></div>
              <div><strong>{{game.questions.length-score()}}</strong><span>Errori</span></div>
              <div><strong>{{timeText()}}</strong><span>Tempo totale</span></div>
            </div>
            @if (newRecord()) {
              <p class="result-record" role="status">✦ Nuovo record personale su questo dispositivo!</p>
            } @else if (previousBest(); as best) {
              <p class="result-record-secondary">Miglior risultato locale per questo quiz: {{best.correct}}/{{best.total}} in {{formatSeconds(best.durationSeconds)}}</p>
            } @else {
              <p class="result-record-secondary">Primo risultato registrato su questo dispositivo per questa modalità.</p>
            }
            @if (isDaily) {
              <div class="daily-result-streak" role="status">
                <strong>✓ Sfida giornaliera completata</strong>
                @if (daily.current()?.completed) {
                  <span>🔥 {{daily.current()?.streak}} {{daily.current()?.streak===1?'giorno':'giorni'}} di streak</span>
                } @else {
                  <span>La tua streak viene aggiornata…</span>
                }
                <small>Domani ti aspetta una nuova sfida. Intanto puoi continuare a giocare!</small>
              </div>
            }
            @if (isDaily) {
              <a class="daily-leaderboard-link" routerLink="/classifica">♛ Guarda la classifica del giorno ↗</a>
            }
            <div class="result-actions">
              @if (!isDaily) {
                <button class="button button-primary" type="button" (click)="restart()">Gioca ancora ↻</button>
                <a class="button button-ghost" routerLink="/" fragment="categorie">Esplora altri quiz ↗</a>
              } @else {
                <a class="button button-primary" routerLink="/" fragment="categorie">Prova altri quiz ↗</a>
              }
              <button class="button button-ghost" type="button" (click)="shareResult()">Condividi risultato</button>
            </div>
            @if (shareStatus()) {<p role="status" class="result-share-status">{{shareStatus()}}</p>}
            <p class="helper-note">Punteggio e tempo verificati dal server. Il record qui mostrato è locale al dispositivo.</p>
          </div>
          @if (review().length) {
            <section class="result-review" aria-labelledby="result-review-heading">
              <div class="result-review-header">
                <div><div class="eyebrow secondary">IMPARA DAGLI ERRORI</div><h3 id="result-review-heading">Rivedi le risposte</h3></div>
                <span class="result-review-count">{{review().length}} domande</span>
              </div>
              <div class="result-review-filters" role="group" aria-label="Filtra il riepilogo">
                <button type="button" [class.active]="reviewMode()==='errors'"
                  [attr.aria-pressed]="reviewMode()==='errors'" (click)="reviewMode.set('errors')"
                  [disabled]="mistakes()===0">Errori ({{mistakes()}})</button>
                <button type="button" [class.active]="reviewMode()==='all'"
                  [attr.aria-pressed]="reviewMode()==='all'" (click)="reviewMode.set('all')">Tutte ({{review().length}})</button>
              </div>
              @if (visibleReview().length===0) {
                <div class="result-review-perfect"><span aria-hidden="true">✳</span> Nessun errore! Puoi comunque rivedere tutte le domande.</div>
              } @else {
                <div class="result-review-list">
                  @for (item of visibleReview(); track item.position) {
                    <article class="result-review-item" [class.is-correct]="item.is_correct===1">
                      <div class="result-review-meta">
                        <span>DOMANDA {{item.position}}</span>
                        <span>{{item.is_correct===1?'✓ CORRETTA':'✕ DA RIPASSARE'}}</span>
                      </div>
                      <h4>{{game.questions[item.position-1].prompt}}</h4>
                      <p><strong>La tua risposta:</strong> {{game.questions[item.position-1].options[item.selected_option_index]}}</p>
                      @if (item.is_correct!==1) {
                        <p class="result-correct-answer"><strong>Risposta corretta:</strong> {{game.questions[item.position-1].options[item.correct_option_index]}}</p>
                      }
                      @if (item.explanation) {<p class="result-review-explanation">{{item.explanation}}</p>}
                    </article>
                  }
                </div>
              }
            </section>
          }
        }
      }
    </section>
  `
})
export class QuizPage implements OnInit {
  private readonly route=inject(ActivatedRoute);
  private readonly api=inject(QuizApiService);
  private readonly progress=inject(ProgressService);
  private readonly auth=inject(AuthService);
  protected readonly daily=inject(DailyProgressService);
  protected readonly slug=this.route.snapshot.paramMap.get('slug')??'';
  protected readonly isDaily=this.slug==='daily';
  private readonly metadata=CATEGORY_STYLES.find(x=>x.slug===this.slug);
  protected readonly title=this.isDaily?'Il quiz del giorno':(this.metadata?.title??'Quiz libero');
  protected readonly description=this.metadata?.description??'Metti alla prova le tue conoscenze.';
  protected readonly letters=['A','B','C','D'];
  protected readonly loading=signal(false);
  protected readonly error=signal('');
  protected readonly busy=signal(false);
  protected readonly session=signal<QuizSession|null>(null);
  protected readonly difficulty=signal<Difficulty>('mixed');
  protected readonly count=signal<5|10|15>(5);
  protected readonly index=signal(0);
  protected readonly selected=signal<number|null>(null);
  protected readonly reveal=signal<QuizAnswer|null>(null);
  protected readonly score=signal(0);
  protected readonly finished=signal(false);
  protected readonly review=signal<QuizReview[]>([]);
  protected readonly reviewMode=signal<'errors'|'all'>('errors');
  protected readonly visibleReview=computed(()=>this.reviewMode()==='all'?this.review():this.review().filter(item=>item.is_correct!==1));
  protected readonly mistakes=computed(()=>this.review().filter(item=>item.is_correct!==1).length);
  protected readonly durationSeconds=signal<number|null>(null);
  protected readonly previousBest=signal<QuizAttempt|null>(null);
  protected readonly newRecord=signal(false);
  protected readonly shareStatus=signal('');
  protected readonly percent=computed(()=>this.session()?.questions.length?Math.round(this.score()*100/this.session()!.questions.length):0);
  protected readonly resultHeading=computed(()=>{
    const value=this.percent();
    return value===100?'Partita perfetta!':value>=80?'Una gran bella prova!':value>=50?'Ottimo allenamento!':'Ogni risposta ti fa crescere.';
  });
  protected readonly resultMessage=computed(()=>{
    const value=this.percent();
    return value===100?'Hai centrato ogni risposta. Complimenti!':value>=80?'Pochi errori separano questa prova dalla perfezione.':value>=50?'Hai una buona base: controlla gli errori e riprova.':'Rivedi le spiegazioni e torna per una nuova sfida.';
  });
  protected readonly timeText=computed(()=>this.formatSeconds(this.durationSeconds()));
  private startMs=Date.now();
  private romeDay():string {
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const get=(type:string)=>parts.find(p=>p.type===type)?.value??'';
    return `${get('year')}-${get('month')}-${get('day')}`;
  }
  private get storageKey(){return `quizario:live:v1:${this.slug}`;}
  ngOnInit(){void this.restore();}
  protected changeDifficulty(event:Event){const value=(event.target as HTMLSelectElement).value as Difficulty;this.difficulty.set(value);}
  protected changeCount(event:Event){const value=Number((event.target as HTMLSelectElement).value);if(value===5||value===10||value===15)this.count.set(value);}
  protected difficultyName(difficulty:string){return {easy:'FACILE',medium:'MEDIA',hard:'DIFFICILE'}[difficulty as 'easy'|'medium'|'hard']??'MISTA';}
  protected formatSeconds(value:number|null):string {
    if(value===null||!Number.isFinite(value))return '—';
    const seconds=Math.max(0,Math.round(value));
    const minutes=Math.floor(seconds/60);
    return minutes>0?`${minutes}m ${String(seconds%60).padStart(2,'0')}s`:`${seconds}s`;
  }
  protected async shareResult():Promise<void> {
    const game=this.session();if(!game||!this.finished())return;
    const label=this.isDaily?'la sfida giornaliera':this.title;
    const url=typeof window!=='undefined'?`${window.location.origin}/`:'';
    const message=`Quizario ✦ Ho ottenuto ${this.score()}/${game.questions.length} (${this.percent()}%) in ${this.timeText()} su ${label}! Prova anche tu: ${url}`;
    this.shareStatus.set('');
    try{
      if(typeof navigator!=='undefined'&&typeof navigator.share==='function'){
        await navigator.share({title:'Il mio risultato Quizario',text:message});
        return;
      }
      if(typeof navigator!=='undefined'&&navigator.clipboard?.writeText){
        await navigator.clipboard.writeText(message);
        this.shareStatus.set('Risultato copiato negli appunti.');
      }else{
        this.shareStatus.set('La condivisione non è disponibile su questo dispositivo.');
      }
    }catch(error){
      if(error instanceof Error&&error.name==='AbortError')return;
      this.shareStatus.set('Condivisione non riuscita: riprova.');
    }
  }
  private setSession(session:QuizSession){
    if(session.difficulty)this.difficulty.set(session.difficulty);
    this.session.set(session);this.index.set(Math.max(0,Math.min(session.nextPosition-1,session.questions.length-1)));
    this.score.set(session.score);this.reveal.set(null);this.selected.set(null);this.finished.set(!!session.completed);
    this.review.set(session.review??[]);
    this.reviewMode.set((session.review??[]).some(x=>x.is_correct!==1)?'errors':'all');
    this.durationSeconds.set(session.durationSeconds??null);
    this.newRecord.set(false);this.shareStatus.set('');
    this.previousBest.set(bestComparableAttempt(this.progress.attempts(),this.slug,session.questions.length,
      this.isDaily?'daily':this.difficulty()));
    this.startMs=Date.now();
    try{sessionStorage.setItem(this.storageKey,session.sessionToken);}catch{/* storage disabled */}
  }
  private async restore(){
    if(this.isDaily) await this.daily.refresh();
    let token:string|null=null;
    try{token=sessionStorage.getItem(this.storageKey);}catch{/* disabled */}
    if(token){
      this.loading.set(true);
      try{this.setSession(await this.api.resume(token));return;}
      catch {try{sessionStorage.removeItem(this.storageKey);}catch{/* ignored */}}
      finally{this.loading.set(false);}
    }
    if(this.isDaily){
      if(this.daily.error() || this.daily.current()?.completed) return;
      this.loading.set(true);
      try {this.setSession(await this.api.resume());return;}
      catch(e){
        // Missing session is normal for new players. Other errors remain visible.
        if(e instanceof HttpErrorResponse && ![401,404].includes(e.status)){
          this.error.set(apiErrorMessage(e));return;
        }
      }finally{this.loading.set(false);}
      await this.start();
    }
  }
  protected async retryDaily():Promise<void>{
    await this.daily.refresh();
    if(!this.daily.error() && !this.daily.current()?.completed)await this.restore();
  }
  protected async start(){
    if(this.loading() || (this.isDaily && (!this.daily.current() || this.daily.current()?.completed)))return;
    this.loading.set(true);this.error.set('');
    try{this.setSession(await this.api.start(this.isDaily?'daily':'free',this.isDaily?null:this.slug,this.difficulty(),this.count()));}
    catch(e){this.error.set(apiErrorMessage(e));}
    finally{this.loading.set(false);}
  }
  protected async choose(answer:number){
    const game=this.session();if(!game||this.busy()||this.reveal()||this.finished())return;
    this.busy.set(true);this.error.set('');
    try{
      const result=await this.api.answer(game.sessionToken,this.index()+1,answer);
      this.selected.set(answer);this.reveal.set(result);this.score.set(result.score);
      if(result.completed){
        // The server calculates duration from the real session start (also after a reload).
        const seconds=result.durationSeconds??Math.max(1,Math.round((Date.now()-this.startMs)/1000));
        this.durationSeconds.set(seconds);this.review.set(result.review??[]);
        this.reviewMode.set((result.review??[]).some(x=>x.is_correct!==1)?'errors':'all');
        const difficulty=this.isDaily?'daily':this.difficulty();
        const previous=bestComparableAttempt(this.progress.attempts(),this.slug,result.total,difficulty);
        this.previousBest.set(previous);
        this.newRecord.set(beatsPreviousBest(result.score,seconds,previous));
        // Persist immediately, even if the player closes the tab before opening results.
        this.progress.save({slug:this.slug,date:this.romeDay(),correct:result.score,
          total:result.total,durationSeconds:seconds,difficulty,ownerId:this.auth.user()?.id??null});
        if(this.isDaily)void this.daily.refresh();
      }
    }catch(e){this.error.set(apiErrorMessage(e));}
    finally{this.busy.set(false);}
  }
  protected next(){
    const game=this.session();const last=this.reveal();if(!game||!last)return;
    if(last.completed){
      // Keep the session token until expiry so a reload can restore this verified summary.
      this.finished.set(true);
    }else{
      this.index.update(i=>i+1);this.reveal.set(null);this.selected.set(null);
    }
  }
  protected restart(){
    try{sessionStorage.removeItem(this.storageKey);}catch{/* ignored */}
    this.session.set(null);this.index.set(0);this.score.set(0);this.finished.set(false);
    this.review.set([]);this.durationSeconds.set(null);this.previousBest.set(null);
    this.newRecord.set(false);this.shareStatus.set('');this.reviewMode.set('errors');
    this.reveal.set(null);this.error.set('');
  }
}
