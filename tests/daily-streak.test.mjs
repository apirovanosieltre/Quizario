import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const code=readFileSync(new URL('../src/app/core/daily-streak.ts',import.meta.url),'utf8');
const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
new Function('exports','module',js)(mod.exports,mod);
const {romeDay,previousDay,dailyStreak,guestDailySummary,dailyCalendar,longestDailyStreak,nextStreakMilestone}=mod.exports;

test('Rome day boundaries survive CET and DST transitions',()=>{
  assert.equal(romeDay(new Date('2026-03-28T23:30:00Z')),'2026-03-29');
  assert.equal(romeDay(new Date('2026-10-24T22:30:00Z')),'2026-10-25');
  assert.equal(previousDay('2026-03-30'),'2026-03-29');
  assert.equal(previousDay('2026-01-01'),'2025-12-31');
  assert.throws(()=>previousDay('2026-02-30'));
});

test('daily streak counts distinct consecutive played dates, including zero-score completions',()=>{
  assert.equal(dailyStreak(['2026-11-10','2026-11-11','2026-11-12'],'2026-11-12'),3);
  assert.equal(dailyStreak(['2026-11-10','2026-11-11','2026-11-11'],'2026-11-12'),2);
  assert.equal(dailyStreak(['2026-11-09','2026-11-11'],'2026-11-12'),1);
  assert.equal(dailyStreak(['2026-11-10'],'2026-11-12'),0);
  assert.equal(dailyStreak([],'2026-11-12'),0);
});

test('guest status uses device records, never signed-in account attempts',()=>{
  const attempts=[
    {slug:'daily',date:'2026-11-10',correct:0,total:10,durationSeconds:40,ownerId:null},
    {slug:'daily',date:'2026-11-11',correct:3,total:10,durationSeconds:50},
    {slug:'daily',date:'2026-11-12',correct:6,total:10,durationSeconds:65,ownerId:'someone-else'},
    {slug:'scienza',date:'2026-11-12',correct:5,total:5,durationSeconds:20},
  ];
  const pending=guestDailySummary(attempts,'2026-11-12');
  assert.equal(pending.completed,false);
  assert.equal(pending.score,null);
  assert.equal(pending.streak,2);
  const completed=guestDailySummary([...attempts,{slug:'daily',date:'2026-11-12',correct:0,total:10,durationSeconds:70,ownerId:null}],'2026-11-12');
  assert.equal(completed.completed,true);
  assert.equal(completed.score,0);
  assert.equal(completed.total,10);
  assert.equal(completed.durationSeconds,70);
  assert.equal(completed.streak,3);
  assert.equal(completed.scope,'device');
});

test('four-week calendar, achievements and streak record are deterministic',()=>{
  const days=['2026-11-08','2026-11-09','2026-11-10','2026-11-12','2026-11-13'];
  const grid=dailyCalendar('2026-11-13',days);
  assert.equal(grid.length,28);
  assert.equal(grid.at(-1).date,'2026-11-13');
  assert.equal(grid.at(-1).done,true);
  assert.equal(grid.filter(x=>x.done).length,5);
  assert.equal(longestDailyStreak(days),3);
  assert.equal(nextStreakMilestone(0),3);
  assert.equal(nextStreakMilestone(3),7);
  assert.equal(nextStreakMilestone(7),14);
  assert.equal(nextStreakMilestone(99),100);
  assert.equal(nextStreakMilestone(100),null);
  const aroundDST=dailyCalendar('2026-03-30',['2026-03-29','2026-03-30']);
  assert.equal(aroundDST.filter(x=>x.done).length,2);
  assert.equal(new Set(aroundDST.map(x=>x.date)).size,28);
});
test('guest completion stats include 0-point games and longest streak',()=>{
  const attempts=['2026-11-09','2026-11-10','2026-11-11','2026-11-13'].map(date=>({
    slug:'daily',date,correct:0,total:10,durationSeconds:81,ownerId:null,
  }));
  const summary=guestDailySummary(attempts,'2026-11-13');
  assert.equal(summary.completed,true);
  assert.equal(summary.score,0);
  assert.equal(summary.streak,1);
  assert.equal(summary.bestStreak,3);
  assert.equal(summary.totalDays,4);
  assert.equal(summary.recentDays.length,4);
});
