/** Shared date-only logic for daily quiz progress in the Europe/Rome calendar. */
export interface DailySummary {
  today:string;
  completed:boolean;
  score:number|null;
  total:number|null;
  durationSeconds:number|null;
  streak:number;
  scope:'account'|'device';
}
export interface DailyAttempt {
  slug:string;
  date:string;
  correct:number;
  total:number;
  durationSeconds:number;
  ownerId?:string|null;
}

export function romeDay(now=new Date()):string {
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',
  }).formatToParts(now);
  const get=(type:string)=>parts.find(x=>x.type===type)?.value??'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Calendar-day arithmetic in UTC prevents DST shifts in Italian midnight dates. */
export function previousDay(day:string):string {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Data non valida.');
  const date=new Date(day+'T00:00:00Z');
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==day)
    throw Error('Data non valida.');
  date.setUTCDate(date.getUTCDate()-1);
  return date.toISOString().slice(0,10);
}

/** Keep yesterday's streak visible as "at risk" until today's quiz is completed. */
export function dailyStreak(days:Iterable<string>,today:string):number {
  const played=new Set(days);
  let cursor=played.has(today)?today:previousDay(today);
  let count=0;
  while(played.has(cursor)){
    count++;
    cursor=previousDay(cursor);
  }
  return count;
}

/**
 * Guests have no server account history: show only their local device results.
 * Historical entries without ownerId are legacy local results and remain supported.
 */
export function guestDailySummary(attempts:readonly DailyAttempt[],today=romeDay()):DailySummary {
  const daily=attempts.filter(a=>a.slug==='daily' && (a.ownerId===null || a.ownerId===undefined)
    && /^\d{4}-\d{2}-\d{2}$/.test(a.date) && a.date<=today);
  const done=daily.filter(a=>a.date===today).at(-1);
  return {
    today,completed:!!done,score:done?.correct??null,total:done?.total??null,
    durationSeconds:done?.durationSeconds??null,
    streak:dailyStreak(daily.map(a=>a.date),today),scope:'device',
  };
}
