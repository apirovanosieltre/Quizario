import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');

// Isolate pure comparison helpers from Angular's dependency-injection runtime.
const src=readFileSync(new URL('../src/app/core/progress.service.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
const mod={exports:{}};
const angular={ Injectable:()=>target=>target, computed:()=>null, signal:()=>null };
new Function('require','exports','module',compiled)((id)=>{
  if(id==='@angular/core')return angular;
  throw Error('Unexpected dependency '+id);
},mod.exports,mod);
const {bestComparableAttempt,beatsPreviousBest,compactAttempts}=mod.exports;

test('record comparisons respect category, length and difficulty',()=>{
  const attempts=[
    {slug:'storia',difficulty:'hard',correct:5,total:5,durationSeconds:30},
    {slug:'scienza',difficulty:'easy',correct:4,total:5,durationSeconds:80},
    {slug:'scienza',difficulty:'mixed',correct:3,total:5,durationSeconds:80},
    {slug:'scienza',difficulty:'mixed',correct:4,total:5,durationSeconds:90},
    {slug:'scienza',difficulty:'mixed',correct:4,total:5,durationSeconds:65},
    {slug:'scienza',difficulty:'mixed',correct:10,total:10,durationSeconds:200},
    {slug:'scienza',correct:5,total:5,durationSeconds:15}, // older unknown difficulty
  ];
  const best=bestComparableAttempt(attempts,'scienza',5,'mixed');
  assert.equal(best.correct,4);
  assert.equal(best.durationSeconds,65);
  assert.equal(bestComparableAttempt(attempts,'geografia',5,'mixed'),null);
});
test('record requires genuine improvement, not merely the first attempt',()=>{
  assert.equal(beatsPreviousBest(5,30,null),false);
  const prev={slug:'storia',difficulty:'medium',correct:3,total:5,durationSeconds:60};
  assert.equal(beatsPreviousBest(4,120,prev),true);
  assert.equal(beatsPreviousBest(3,59,prev),true);
  assert.equal(beatsPreviousBest(3,60,prev),false);
  assert.equal(beatsPreviousBest(2,15,prev),false);
});

test('local retention keeps daily streak history despite frequent free quizzes',()=>{
  const daily=[
    {slug:'daily',date:'2026-11-10',correct:1,total:10,durationSeconds:30,ownerId:null},
    {slug:'daily',date:'2026-11-11',correct:2,total:10,durationSeconds:40,ownerId:null},
    {slug:'daily',date:'2026-11-12',correct:3,total:10,durationSeconds:50,ownerId:null},
  ];
  const manyFree=Array.from({length:150},(_,i)=>({slug:'scienza',date:'2026-11-12',
    correct:i%5,total:5,durationSeconds:20+i,ownerId:null}));
  const compact=compactAttempts([...daily,...manyFree]);
  assert.equal(compact.filter(x=>x.slug==='daily').length,3);
  assert.equal(compact.filter(x=>x.slug!=='daily').length,100);
  assert.equal(compact.length,103);
  const duplicate=compactAttempts([...daily,{...daily[2],correct:9}]);
  assert.equal(duplicate.filter(x=>x.slug==='daily').length,3);
  assert.equal(duplicate.at(-1).correct,9);
});
