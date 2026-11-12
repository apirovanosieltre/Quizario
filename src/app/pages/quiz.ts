import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ProgressService } from '../core/progress.service';
import { apiErrorMessage } from '../core/errors';
import { Difficulty, QuizAnswer, QuizApiService, QuizSession } from '../core/quiz-api.service';
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
        <div class="question-card"><h2>La sfida non è disponibile</h2><p>{{error() || 'Non è stato possibile caricare le domande.'}}</p>
          <button class="button button-primary" type="button" (click)="start()">Riprova</button></div>
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
          <div class="result-card"><span class="result-celebration" aria-hidden="true">✦ ◈ ✳</span>
            <div class="eyebrow secondary">PARTITA COMPLETATA</div><h2>Quiz concluso!</h2>
            <div class="result-score">{{score()}}<span>/{{game.questions.length}}</span></div>
            <p>Risposte esatte · {{percent()}}%</p>
            <div class="result-actions">
              @if (!isDaily) {<button class="button button-primary" type="button" (click)="restart()">Nuovo quiz ↻</button>}
              <a class="button button-ghost" routerLink="/">Scopri altri quiz ↗</a>
            </div>
            <p class="helper-note">Risultato verificato dal server. I risultati degli utenti autenticati vengono anche salvati nell'account.</p>
          </div>
        }
      }
    </section>
  `
})
export class QuizPage implements OnInit {
  private readonly route=inject(ActivatedRoute);
  private readonly api=inject(QuizApiService);
  private readonly progress=inject(ProgressService);
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
  protected readonly percent=computed(()=>this.session()?.questions.length?Math.round(this.score()*100/this.session()!.questions.length):0);
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
  private setSession(session:QuizSession){
    this.session.set(session);this.index.set(Math.min(session.nextPosition-1,session.questions.length-1));
    this.score.set(session.score);this.reveal.set(null);this.selected.set(null);this.finished.set(!!session.completed);this.startMs=Date.now();
    try{sessionStorage.setItem(this.storageKey,session.sessionToken);}catch{/* storage disabled */}
  }
  private async restore(){
    let token:string|null=null;
    try{token=sessionStorage.getItem(this.storageKey);}catch{/* disabled */}
    if(token){
      this.loading.set(true);
      try{this.setSession(await this.api.resume(token));return;}
      catch {try{sessionStorage.removeItem(this.storageKey);}catch{/* ignored */}}
      finally{this.loading.set(false);}
    }
    if(this.isDaily){
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
  protected async start(){
    if(this.loading())return;
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
        // Persist as soon as the last answer is validated, even if the player closes the dialog.
        this.progress.save({slug:this.slug,date:this.romeDay(),correct:result.score,
          total:result.total,durationSeconds:Math.max(1,Math.round((Date.now()-this.startMs)/1000))});
      }
    }catch(e){this.error.set(apiErrorMessage(e));}
    finally{this.busy.set(false);}
  }
  protected next(){
    const game=this.session();const last=this.reveal();if(!game||!last)return;
    if(last.completed){
      this.finished.set(true);
      try{sessionStorage.removeItem(this.storageKey);}catch{/* ignored */}

    }else{
      this.index.update(i=>i+1);this.reveal.set(null);this.selected.set(null);
    }
  }
  protected restart(){
    try{sessionStorage.removeItem(this.storageKey);}catch{/* ignored */}
    this.session.set(null);this.index.set(0);this.score.set(0);this.finished.set(false);
    this.reveal.set(null);this.error.set('');
  }
}
