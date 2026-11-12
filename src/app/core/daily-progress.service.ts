import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { apiErrorMessage } from './errors';
import { ProgressService } from './progress.service';
import { QuizApiService } from './quiz-api.service';
import { guestDailySummary, romeDay, type DailySummary } from './daily-streak';

/** A single observable view for homepage and daily-quiz screens. */
@Injectable({providedIn:'root'})
export class DailyProgressService {
  private readonly auth=inject(AuthService);
  private readonly api=inject(QuizApiService);
  private readonly progress=inject(ProgressService);
  private readonly accountStatus=signal<DailySummary|null>(null);
  private readonly accountId=signal<string|null>(null);
  private readonly today=signal(romeDay());
  private requestGeneration=0;
  readonly loading=signal(false);
  readonly error=signal('');

  readonly current=computed<DailySummary|null>(()=>{
    if(this.auth.loading())return null;
    const user=this.auth.user();
    if(!user)return guestDailySummary(this.progress.attempts(),this.today());
    return this.accountId()===user.id ? this.accountStatus():null;
  });

  async refresh():Promise<void> {
    const request=++this.requestGeneration;
    await this.auth.bootstrap();
    if(request!==this.requestGeneration)return;
    this.today.set(romeDay());
    const user=this.auth.user();
    if(!user){
      this.accountStatus.set(null);
      this.accountId.set(null);
      this.loading.set(false);
      this.error.set('');
      return;
    }
    // Avoid briefly presenting yesterday's result after a day rollover.
    this.accountStatus.set(null);
    this.accountId.set(user.id);
    this.loading.set(true);
    this.error.set('');
    try{
      const response=await this.api.dailyStatus();
      if(request===this.requestGeneration && this.auth.user()?.id===user.id) this.accountStatus.set(response);
    }catch(error){
      if(request===this.requestGeneration && this.auth.user()?.id===user.id){
        this.accountStatus.set(null);
        this.error.set(apiErrorMessage(error));
      }
    }finally{
      if(request===this.requestGeneration)this.loading.set(false);
    }
  }
}
