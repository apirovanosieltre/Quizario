import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
export interface AccountResult {
  quiz_date:string;quiz_slug:string;score:number;total:number;duration_seconds:number;completed_at:string;
}
@Injectable({providedIn:'root'})
export class ResultsService {
  private readonly http=inject(HttpClient);
  list():Promise<AccountResult[]> {
    return firstValueFrom(this.http.get<{results:AccountResult[]}>('/api/account/results')).then(r=>r.results);
  }
}
