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
  readonly loading=signal(false);
  readonly error=signal('');

  readonly current=computed<DailySummary|null>(()=>{
    if(this.auth.loading())return null;
    const user=this.auth.user();
    if(!user)return guestDailySummary(this.progress.attempts(),romeDay());
    return this.accountId()===user.id ? this.accountStatus():null;
  });

  async refresh():Promise<void> {
    await this.auth.bootstrap();
    const user=this.auth.user();
    if(!user){
      this.accountStatus.set(null);
      this.accountId.set(null);
      this.loading.set(false);
      this.error.set('');
      return;
    }
    if(this.accountId()!==user.id){
      this.accountStatus.set(null);
      this.accountId.set(user.id);
    }
    this.loading.set(true);
    this.error.set('');
    try{
      const response=await this.api.dailyStatus();
      if(this.auth.user()?.id===user.id) this.accountStatus.set(response);
    }catch(error){
      if(this.auth.user()?.id===user.id){
        this.accountStatus.set(null);
        this.error.set(apiErrorMessage(error));
      }
    }finally{
      if(this.auth.user()?.id===user.id)this.loading.set(false);
    }
  }
}
