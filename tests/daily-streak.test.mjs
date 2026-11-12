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
const {romeDay,previousDay,dailyStreak,guestDailySummary}=mod.exports;

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
