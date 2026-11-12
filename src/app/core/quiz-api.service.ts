import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type Difficulty = 'easy'|'medium'|'hard'|'mixed';
export type QuizMode = 'free'|'daily';
export interface CategoryCount { slug:string; label:string; total:number; }
export interface QuizCatalog {
  categories:CategoryCount[];
  difficulties:{tier:string;total:number}[];
  today:string;
}
export interface PublicQuestion { id:string;prompt:string;difficulty:string;options:string[]; }
export interface QuizReview {
  position:number;
  question_id:string;
  selected_option_index:number;
  correct_option_index:number;
  is_correct:number;
  explanation:string|null;
}
export interface QuizSession {
  sessionToken:string;
  mode:QuizMode;
  date:string|null;
  questions:PublicQuestion[];
  nextPosition:number;
  score:number;
  completed?:boolean;
  durationSeconds?:number;
  review?:QuizReview[];
}
export interface QuizAnswer {
  isCorrect:boolean; correctOptionIndex:number; explanation:string;
  score:number;total:number;completed:boolean;
  durationSeconds?:number;
  review?:QuizReview[];
}
export interface EditorialOption { option_index:number;answer_text:string;is_correct:number; }
export interface EditorialQuestion {
  id:string; prompt:string; explanation:string|null; category_slug:string;
  editor_difficulty:string; effective_difficulty:string; status:string;
  language:string; source_url:string; source_id:string; source_item_id:string|null;
  verified_at:string|null; revision:number; possible_duplicate:boolean;
  created_at:string; options:EditorialOption[];
}
export interface EditorialDraft {
  revision:number;prompt:string;explanation:string;category:string;difficulty:string;
  sourceUrl:string;answers:string[];correctIndex:number;
}
export interface ReviewFilter {
  status:string;category?:string;difficulty?:string;search?:string;offset?:number;limit?:number;
}
@Injectable({providedIn:'root'})
export class QuizApiService {
  private readonly http=inject(HttpClient);
  catalog():Promise<QuizCatalog> { return firstValueFrom(this.http.get<QuizCatalog>('/api/quiz/catalog')); }
  start(mode:QuizMode, category:string|null, difficulty:Difficulty='mixed', count=10):Promise<QuizSession> {
    return firstValueFrom(this.http.post<QuizSession>('/api/quiz/start',mode==='daily'?{mode}:{mode,category,difficulty,count}));
  }
  resume(sessionToken?:string):Promise<QuizSession> {
    return firstValueFrom(this.http.post<QuizSession>('/api/quiz/resume',sessionToken?{sessionToken}:{}));
  }
  answer(sessionToken:string,position:number,optionIndex:number):Promise<QuizAnswer> {
    return firstValueFrom(this.http.post<QuizAnswer>('/api/quiz/answer',{sessionToken,position,optionIndex}));
  }
  review(filter:ReviewFilter):Promise<{items:EditorialQuestion[];total:number;offset:number;limit:number}> {
    const params:Record<string,string>={status:filter.status};
    if(filter.category)params['category']=filter.category;
    if(filter.difficulty)params['difficulty']=filter.difficulty;
    if(filter.search)params['search']=filter.search;
    if(filter.offset!==undefined)params['offset']=String(filter.offset);
    if(filter.limit!==undefined)params['limit']=String(filter.limit);
    return firstValueFrom(this.http.get<{items:EditorialQuestion[];total:number;offset:number;limit:number}>('/api/admin/questions',{params}));
  }
  reviewSummary():Promise<{counts:{status:string;total:number}[]}> {
    return firstValueFrom(this.http.get<{counts:{status:string;total:number}[]}>('/api/admin/questions/summary'));
  }
  editQuestion(id:string,draft:EditorialDraft):Promise<void> {
    return firstValueFrom(this.http.put<void>(`/api/admin/questions/${encodeURIComponent(id)}/edit`,draft));
  }
  bulkQuestions(ids:string[],action:'review'|'reject'):Promise<{ok:boolean;updated:number}> {
    return firstValueFrom(this.http.post<{ok:boolean;updated:number}>('/api/admin/questions/bulk',{ids,action}));
  }
  moderate(id:string,action:'publish'|'reject'):Promise<void> {
    return firstValueFrom(this.http.post<void>(`/api/admin/questions/${encodeURIComponent(id)}/${action}`,action==='publish'?{verified:true}:{}));
  }
}