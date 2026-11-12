import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QuizApiService, EditorialQuestion, EditorialDraft } from '../core/quiz-api.service';
import { apiErrorMessage } from '../core/errors';
import { CATEGORY_STYLES } from '../data/categories';

@Component({
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="container admin-wrap">
      <a routerLink="/" class="back-link">← Torna alla home</a>
      <div class="eyebrow secondary">ACCESSO RISERVATO</div>
      <h1>Revisione domande</h1>
      <p class="muted-copy">Correggi le bozze, controlla eventuali duplicati e pubblica solo dopo aver verificato la fonte e le quattro risposte.</p>
      <div class="admin-summary" aria-label="Stato archivio">
        @for (s of summary(); track s.status) {
          <div><strong>{{s.total}}</strong><span>{{labelStatus(s.status)}}</span></div>
        }
      </div>
      <div class="review-tabs" role="group" aria-label="Stato domande">
        @for (tab of tabs; track tab.id) {
          <button type="button" [class.active]="status()===tab.id" [attr.aria-pressed]="status()===tab.id" (click)="changeStatus(tab.id)">{{tab.label}}</button>
        }
      </div>
      <form class="admin-filters" (ngSubmit)="applyFilters()">
        <label for="admin-search">Cerca domanda o ID fonte
          <input id="admin-search" type="search" name="search" [ngModel]="search()" (ngModelChange)="search.set($event)" maxlength="80" placeholder="Parola chiave…">
        </label>
        <label for="admin-category">Categoria
          <select id="admin-category" name="category" [ngModel]="category()" (ngModelChange)="category.set($event)">
            <option value="">Tutte</option>
            @for (c of categories; track c.slug) { <option [value]="c.slug">{{c.title}}</option> }
          </select>
        </label>
        <label for="admin-difficulty">Difficoltà
          <select id="admin-difficulty" name="difficulty" [ngModel]="difficulty()" (ngModelChange)="difficulty.set($event)">
            <option value="">Tutte</option><option value="easy">Facile</option><option value="medium">Media</option><option value="hard">Difficile</option>
          </select>
        </label>
        <button type="submit" class="button button-ghost" [disabled]="loading()">Filtra</button>
      </form>
      @if (error()) { <p class="form-error" role="alert">{{error()}}</p> }
      @if (notice()) { <p class="form-notice" role="status">{{notice()}}</p> }
      <div class="admin-toolbar">
        <p class="muted-copy">{{total()}} domande trovate · pagina {{page()+1}} di {{pages()}}</p>
        @if (status()==='draft'||status()==='review') {
          <div class="admin-bulk">
            <label><input type="checkbox" [checked]="allSelected()" [disabled]="!items().length || loading()" (change)="selectAll($any($event.target).checked)"> Seleziona pagina</label>
            <span>{{selected().length}} selezionate</span>
            @if (status()==='draft') {
              <button type="button" [disabled]="!selected().length || !!working()" (click)="bulk('review')">Metti in revisione</button>
            }
            <button type="button" [disabled]="!selected().length || !!working()" (click)="bulk('reject')">Rifiuta selezionate</button>
          </div>
        }
      </div>
      @if (loading()) { <div class="question-card"><p role="status">Caricamento archivio…</p></div> }
      @else if (items().length===0) { <div class="question-card"><p>Nessuna domanda con questi filtri.</p></div> }
      @else {
        <div class="review-list">
          @for (item of items(); track item.id) {
            <article class="question-card review-item">
              <div class="question-meta">
                <span>{{item.category_slug}} · {{level(item.editor_difficulty)}} · {{item.source_id}}</span>
                <span>{{labelStatus(item.status)}} · rev. {{item.revision}}</span>
              </div>
              @if (item.status==='draft'||item.status==='review') {
                <label class="admin-select"><input type="checkbox" [checked]="selected().includes(item.id)" (change)="toggle(item.id,$any($event.target).checked)"> Seleziona</label>
              }
              @if (item.possible_duplicate) { <p class="admin-quality-alert" role="status">Possibile duplicato: verifica prima della pubblicazione.</p> }
              @if (qualityIssues(item).length) {
                <p class="admin-quality-alert">Da controllare: {{qualityIssues(item).join(' · ')}}</p>
              }
              @if (editing()===item.id && draft(); as d) {
                <form class="admin-editor" (ngSubmit)="save(item)">
                  <label>Domanda <textarea name="prompt" [(ngModel)]="d.prompt" maxlength="500" rows="3" required minlength="12"></textarea></label>
                  <label>Spiegazione <textarea name="explanation" [(ngModel)]="d.explanation" maxlength="1000" rows="3" required minlength="12"></textarea></label>
                  <div class="admin-editor-grid">
                    <label>Categoria <select name="editCategory" [(ngModel)]="d.category">
                      @for (c of categories; track c.slug) { <option [value]="c.slug">{{c.title}}</option> }
                    </select></label>
                    <label>Difficoltà <select name="editDifficulty" [(ngModel)]="d.difficulty">
                      <option value="easy">Facile</option><option value="medium">Media</option><option value="hard">Difficile</option>
                    </select></label>
                  </div>
                  <p class="muted-copy">Inserisci quattro risposte differenti e seleziona l’unica corretta.</p>
                  @for (answer of d.answers; track $index) {
                    <div class="admin-answer-edit">
                      <label [attr.for]="'opt-'+item.id+'-'+$index">Risposta {{$index+1}}
                        <input [id]="'opt-'+item.id+'-'+$index" [name]="'answer'+$index" [(ngModel)]="d.answers[$index]" maxlength="200" required>
                      </label>
                      <label class="admin-correct"><input type="radio" name="correct" [value]="$index" [checked]="d.correctIndex===$index" (change)="d.correctIndex=$index"> Corretta</label>
                    </div>
                  }
                  <label>URL fonte verificabile <input type="url" name="sourceUrl" [(ngModel)]="d.sourceUrl" maxlength="500" required></label>
                  <p class="muted-copy">Salvando la domanda torna in bozza e perde la precedente verifica. Eventuali contenuti pubblicati non possono essere modificati direttamente.</p>
                  <div class="review-actions">
                    <button type="submit" class="button button-primary" [disabled]="!!working()">{{working()===item.id?'Salvataggio…':'Salva modifiche'}}</button>
                    <button type="button" class="button button-ghost" (click)="cancelEdit()">Annulla</button>
                  </div>
                </form>
              } @else {
                <h2>{{item.prompt}}</h2>
                <div class="review-options">
                  @for (option of item.options; track option.option_index) {
                    <div [class.correct]="option.is_correct===1">{{option.option_index+1}}. {{option.answer_text}} {{option.is_correct===1?'✓':''}}</div>
                  }
                </div>
                <p>{{item.explanation || 'Spiegazione mancante'}}</p>
                <p><a [href]="item.source_url" target="_blank" rel="noopener noreferrer">Verifica fonte esterna ↗</a></p>
                @if (item.status==='draft'||item.status==='review') {
                  <div class="review-actions">
                    <button type="button" class="button button-ghost" [disabled]="!!working()" (click)="beginEdit(item)">Modifica</button>
                    <button type="button" class="button button-primary" [disabled]="!!working() || item.possible_duplicate || qualityIssues(item).length>0" (click)="moderate(item,'publish')">Ho verificato · Pubblica</button>
                    <button type="button" class="button button-ghost" [disabled]="!!working()" (click)="moderate(item,'reject')">Rifiuta</button>
                  </div>
                }
              }
            </article>
          }
        </div>
      }
      <nav class="admin-pagination" aria-label="Pagine archivio">
        <button type="button" class="button button-ghost" [disabled]="page()===0||loading()" (click)="goPage(-1)">← Precedente</button>
        <span>{{page()+1}} / {{pages()}}</span>
        <button type="button" class="button button-ghost" [disabled]="page()+1>=pages()||loading()" (click)="goPage(1)">Successiva →</button>
      </nav>
    </section>
  `,
})
export class AdminPage implements OnInit {
  private readonly api=inject(QuizApiService);
  protected readonly categories=CATEGORY_STYLES;
  protected readonly tabs=[{id:'draft',label:'Bozze'},{id:'review',label:'Da verificare'},{id:'published',label:'Pubblicate'},{id:'rejected',label:'Rifiutate'}];
  protected readonly items=signal<EditorialQuestion[]>([]);
  protected readonly summary=signal<{status:string;total:number}[]>([]);
  protected readonly status=signal('draft');
  protected readonly category=signal('');
  protected readonly difficulty=signal('');
  protected readonly search=signal('');
  protected readonly offset=signal(0);
  protected readonly limit=20;
  protected readonly total=signal(0);
  protected readonly page=computed(()=>Math.floor(this.offset()/this.limit));
  protected readonly pages=computed(()=>Math.max(1,Math.ceil(this.total()/this.limit)));
  protected readonly selected=signal<string[]>([]);
  protected readonly allSelected=computed(()=>this.items().length>0 && this.items().every(item=>this.selected().includes(item.id)));
  protected readonly editing=signal('');
  protected readonly draft=signal<EditorialDraft|null>(null);
  protected readonly error=signal('');
  protected readonly notice=signal('');
  protected readonly loading=signal(false);
  protected readonly working=signal('');
  ngOnInit():void { void this.load(); }
  protected labelStatus(status:string):string {return ({draft:'Bozze',review:'In revisione',published:'Pubblicate',rejected:'Rifiutate',archived:'Archiviate'} as Record<string,string>)[status]??status;}
  protected level(tier:string):string {return ({easy:'Facile',medium:'Media',hard:'Difficile'} as Record<string,string>)[tier]??tier;}
  protected qualityIssues(item:EditorialQuestion):string[] {
    const problems:string[]=[];
    if(item.language!=='it')problems.push('traduzione italiana');
    if(!item.explanation || item.explanation.trim().length<12)problems.push('spiegazione');
    if(item.options.length!==4 || item.options.filter(x=>x.is_correct===1).length!==1)problems.push('quattro risposte, una corretta');
    if(!item.source_url.startsWith('https://'))problems.push('fonte HTTPS');
    return problems;
  }
  protected changeStatus(status:string):void {this.status.set(status);this.applyFilters();}
  protected applyFilters():void {this.offset.set(0);this.selected.set([]);this.cancelEdit();void this.load();}
  protected goPage(delta:number):void {const next=this.page()+delta;if(next<0||next>=this.pages())return;this.offset.set(next*this.limit);this.selected.set([]);this.cancelEdit();void this.load();}
  protected async load():Promise<void> {
    this.loading.set(true);this.error.set('');
    try {
      const [page,summary]=await Promise.all([
        this.api.review({status:this.status(),category:this.category(),difficulty:this.difficulty(),search:this.search(),offset:this.offset(),limit:this.limit}),
        this.api.reviewSummary()
      ]);
      this.items.set(page.items);this.total.set(page.total);this.summary.set(summary.counts);
    }catch(e){this.items.set([]);this.error.set(apiErrorMessage(e));}
    finally{this.loading.set(false);}
  }
  protected toggle(id:string,checked:boolean):void {this.selected.update(ids=>checked?[...new Set([...ids,id])]:ids.filter(x=>x!==id));}
  protected selectAll(checked:boolean):void {this.selected.set(checked?this.items().filter(x=>x.status==='draft'||x.status==='review').map(x=>x.id):[]);}
  protected beginEdit(item:EditorialQuestion):void {
    this.error.set('');this.notice.set('');this.editing.set(item.id);this.selected.set([]);
    this.draft.set({revision:item.revision,prompt:item.prompt,explanation:item.explanation??'',category:item.category_slug,
      difficulty:item.editor_difficulty,sourceUrl:item.source_url,
      answers:Array.from({length:4},(_,i)=>item.options.find(x=>x.option_index===i)?.answer_text??''),
      correctIndex:Math.max(0,item.options.find(x=>x.is_correct===1)?.option_index??0)});
  }
  protected cancelEdit():void {this.editing.set('');this.draft.set(null);}
  protected async save(item:EditorialQuestion):Promise<void> {
    const edit=this.draft();if(!edit||this.working())return;
    this.working.set(item.id);this.error.set('');this.notice.set('');
    try {await this.api.editQuestion(item.id,edit);this.cancelEdit();await this.load();this.notice.set('Domanda aggiornata e riportata in bozza.');}
    catch(e){this.error.set(apiErrorMessage(e));}
    finally{this.working.set('');}
  }
  protected async bulk(action:'review'|'reject'):Promise<void> {
    const ids=this.selected();if(!ids.length||this.working())return;
    const description=action==='review'?'mettere in revisione':'rifiutare';
    if(!window.confirm(`Vuoi ${description} ${ids.length} domande selezionate?`))return;
    this.working.set('bulk');this.error.set('');this.notice.set('');
    try {const result=await this.api.bulkQuestions(ids,action);this.selected.set([]);await this.load();this.notice.set(`${result.updated} domande aggiornate.`);}
    catch(e){this.error.set(apiErrorMessage(e));}finally{this.working.set('');}
  }
  protected async moderate(item:EditorialQuestion,action:'publish'|'reject'):Promise<void> {
    if(this.working())return;
    if(action==='publish'&&!window.confirm('Hai controllato personalmente fonte, quattro risposte, spiegazione, unicità e diritti di riutilizzo?'))return;
    if(action==='reject'&&!window.confirm('Rifiutare questa domanda?'))return;
    this.working.set(item.id);this.error.set('');this.notice.set('');
    try {await this.api.moderate(item.id,action);await this.load();this.notice.set(action==='publish'?'Domanda pubblicata.':'Domanda rifiutata.');}
    catch(e){this.error.set(apiErrorMessage(e));}finally{this.working.set('');}
  }
}