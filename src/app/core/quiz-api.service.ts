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
export interface QuizSession {
  sessionToken:string;
  mode:QuizMode;
  date:string|null;
  questions:PublicQuestion[];
  nextPosition:number;
  score:number;
  completed?:boolean;
}
export interface QuizAnswer {
  isCorrect:boolean; correctOptionIndex:number; explanation:string;
  score:number;total:number;completed:boolean;
}
export interface EditorialOption { option_index:number;answer_text:string;is_correct:number; }
export interface EditorialQuestion {
  id:string; prompt:string; explanation:string; category_slug:string;
  editor_difficulty:string; effective_difficulty:string; status:string;
  source_url:string; source_id:string; verified_at:string|null;
  created_at:string; option_count:number; options:EditorialOption[];
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
  review(status:string):Promise<{items:EditorialQuestion[]}> {
    return firstValueFrom(this.http.get<{items:EditorialQuestion[]}>('/api/admin/questions',{params:{status}}));
  }
  moderate(id:string,action:'publish'|'reject'):Promise<void> {
    return firstValueFrom(this.http.post<void>(`/api/admin/questions/${encodeURIComponent(id)}/${action}`,action==='publish'?{verified:true}:{}));
  }
}
