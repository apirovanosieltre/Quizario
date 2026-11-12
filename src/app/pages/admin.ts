import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuizApiService, EditorialQuestion } from '../core/quiz-api.service';
import { apiErrorMessage } from '../core/errors';

@Component({
  standalone:true,
  imports:[RouterLink],
  template:`
    <section class="container admin-wrap">
      <a routerLink="/" class="back-link">← Torna alla home</a>
      <div class="eyebrow secondary">ACCESSO RISERVATO</div>
      <h1>Revisione domande</h1>
      <p class="muted-copy">Pubblica soltanto dopo avere verificato la fonte, la domanda e le quattro risposte.</p>
      <div class="review-tabs">
        @for (tab of tabs; track tab.id) {
          <button type="button" [class.active]="status()===tab.id" (click)="changeStatus(tab.id)">{{tab.label}}</button>
        }
      </div>
      @if (error()) {<p class="form-error" role="alert">{{error()}}</p>}
      @if (loading()) {<p role="status">Caricamento...</p>}
      @else if (items().length===0) {<div class="question-card"><p>Nessuna domanda in questo stato, oppure manca l'accesso amministrativo.</p></div>}
      @else {
        <div class="review-list">
          @for (item of items(); track item.id) {
            <article class="question-card review-item">
              <div class="question-meta"><span>{{item.category_slug}} · {{item.editor_difficulty}}</span><span>{{item.source_id}}</span></div>
              <h2>{{item.prompt}}</h2>
              <div class="review-options">
                @for (option of item.options; track option.option_index) {
                  <div [class.correct]="option.is_correct===1">{{option.option_index+1}}. {{option.answer_text}} {{option.is_correct===1?'✓':''}}</div>
                }
              </div>
              <p>{{item.explanation}}</p>
              <p><a [href]="item.source_url" target="_blank" rel="noopener noreferrer">Verifica fonte esterna ↗</a></p>
              @if (status()==='review'||status()==='draft') {
                <div class="review-actions">
                  <button type="button" class="button button-primary" [disabled]="working()===item.id" (click)="moderate(item,'publish')">Ho verificato · Pubblica</button>
                  <button type="button" class="button button-ghost" [disabled]="working()===item.id" (click)="moderate(item,'reject')">Rifiuta</button>
                </div>
              }
            </article>
          }
        </div>
      }
    </section>
  `
})
export class AdminPage implements OnInit {
  private readonly api=inject(QuizApiService);
  protected readonly tabs=[{id:'review',label:'Da verificare'},{id:'draft',label:'Bozze'},{id:'published',label:'Pubblicate'},{id:'rejected',label:'Rifiutate'}];
  protected readonly items=signal<EditorialQuestion[]>([]);
  protected readonly status=signal('review');
  protected readonly error=signal('');
  protected readonly loading=signal(false);
  protected readonly working=signal('');
  ngOnInit(){void this.load();}
  protected changeStatus(status:string){this.status.set(status);void this.load();}
  protected async load(){this.loading.set(true);this.error.set('');try{this.items.set((await this.api.review(this.status())).items);}catch(e){this.items.set([]);this.error.set(apiErrorMessage(e));}finally{this.loading.set(false);}}
  protected async moderate(item:EditorialQuestion,action:'publish'|'reject'){
    if(action==='publish'&&!confirm('Hai verificato la fonte, la risposta esatta, i distrattori e i diritti di riutilizzo?'))return;
    this.working.set(item.id);this.error.set('');
    try{await this.api.moderate(item.id,action);await this.load();}
    catch(e){this.error.set(apiErrorMessage(e));}
    finally{this.working.set('');}
  }
}
