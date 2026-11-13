import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const tsModule=process.env.QUIZARIO_TYPESCRIPT_PATH??'typescript';
const require=createRequire(import.meta.url);
const ts=require(tsModule);

const source=readFileSync(new URL('../worker/questions.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const temp=mkdtempSync(join(tmpdir(),'quizario-api-'));
const output=join(temp,'questions.cjs');writeFileSync(output,js);
const {quizApi,QuizError}=require(output);
const child=spawn('python',['-u',fileURLToPath(new URL('./mock-d1.py',import.meta.url))],{stdio:['pipe','pipe','inherit']});
let buf='';const queue=[];
child.stdout.on('data',chunk=>{buf+=String(chunk);while(buf.includes('\n')){const end=buf.indexOf('\n');const line=buf.slice(0,end);buf=buf.slice(end+1);const x=queue.shift();if(x){const result=JSON.parse(line);if(result.ok)x.resolve(result.result);else x.reject(Error(result.error));}}});
child.on('exit',()=>{while(queue.length)queue.shift().reject(Error('SQLite child exited'));});
function call(sql,params=[],type='query') {return new Promise((resolve,reject)=>{queue.push({resolve,reject});child.stdin.write(JSON.stringify({type,sql,params})+'\n');});}
function batch(ops) {return new Promise((resolve,reject)=>{queue.push({resolve,reject});child.stdin.write(JSON.stringify({type:'batch',ops})+'\n');});}
function prepare(sql){let params=[];return {bind(...items){params=items;return this;},async first(){const r=await call(sql,params);return r.results[0]??null;},async all(){return call(sql,params);},async run(){return call(sql,params);},get _op(){return {sql,params};}};}
const DB={prepare, batch:ops=>batch(ops.map(x=>x._op))};
const env={DB,ADMIN_EMAILS:'admin@test.example',RATING_PEPPER:'local-secret-pepper-at-least-32-characters'};
async function api(path,method='GET',body,user=null){const init={method};if(body){init.headers={'content-type':'application/json'};init.body=JSON.stringify(body);}
  try {const response=await quizApi(new Request('https://quizario.example'+path,init),env,user);return {status:response.status,...await response.json()};}
  catch(error){if(error instanceof QuizError)return {status:error.status,error:error.message};throw error;}}
function log(name) {console.log('OK',name);}
try{
  const catalogue=await api('/api/quiz/catalog');
  assert.equal(catalogue.status,200);assert.equal(catalogue.categories.length,6);
  assert.equal(catalogue.difficulties.reduce((n,x)=>n+x.total,0),32);log('catalogue without private answer keys');
  const free=await api('/api/quiz/start','POST',{mode:'free',category:'scienza',difficulty:'hard',count:5});
  assert.equal(free.status,409);log('category/difficulty insufficiency returns clear 409');
  const mixed=await api('/api/quiz/start','POST',{mode:'free',category:'scienza',difficulty:'mixed',count:5});
  assert.equal(mixed.status,200);assert.equal(mixed.questions.length,5);
  assert.ok(!JSON.stringify(mixed).includes('correctOptionIndex'));assert.ok(!JSON.stringify(mixed).includes('explanation'));
  assert.equal(mixed.review,undefined);assert.equal(mixed.durationSeconds,undefined);
  assert.deepEqual(Object.keys(mixed.questions[0]).sort(),['difficulty','id','options','prompt']);log('no answer key leaks at start');
  const outOfOrder=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position:2,optionIndex:1});
  assert.equal(outOfOrder.status,409);log('answers must be sequential');
  const wrongToken=await api('/api/quiz/answer','POST',{sessionToken:'0'.repeat(64),position:1,optionIndex:0});
  assert.equal(wrongToken.status,401);log('session token enforced');
  const answered=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position:1,optionIndex:0});
  assert.equal(answered.status,200);assert.ok(Number.isInteger(answered.correctOptionIndex));
  assert.equal(answered.review,undefined);log('review withheld before completion');
  const dup=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position:1,optionIndex:0});assert.equal(dup.status,409);log('answer replay blocked');
  const resume=await api('/api/quiz/resume','POST',{sessionToken:mixed.sessionToken});assert.equal(resume.nextPosition,2);
  assert.equal(resume.review,undefined);assert.equal(resume.difficulty,'mixed');log('resume after reload without private review');
  for(let position=2;position<=5;position++){
    const result=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position,optionIndex:0});assert.equal(result.status,200);
    if(position===5){
      assert.equal(result.completed,true);
      assert.ok(Number.isInteger(result.durationSeconds)&&result.durationSeconds>=1);
      assert.equal(result.review.length,5);
      assert.deepEqual(result.review.map(x=>x.position),[1,2,3,4,5]);
      assert.ok(result.review.every(x=>Number.isInteger(x.correct_option_index)&&Number.isInteger(x.selected_option_index)));
      assert.ok(result.review.every(x=>typeof x.explanation==='string'&&x.explanation.length>0));
      log('completed review contains only server-validated answers and elapsed time');
    }
  }
  const after=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position:5,optionIndex:0});assert.equal(after.status,409);
  const completedResume=await api('/api/quiz/resume','POST',{sessionToken:mixed.sessionToken});
  assert.equal(completedResume.completed,true);
  assert.equal(completedResume.review.length,5);
  assert.ok(completedResume.durationSeconds>=1);
  log('server-calculated completion and restored finished review');
  const day1=await api('/api/quiz/start','POST',{mode:'daily'});assert.equal(day1.status,200);assert.equal(day1.questions.length,10);
  assert.deepEqual(day1.questions.map(x=>x.difficulty),['easy','easy','easy','medium','medium','medium','medium','hard','hard','hard']);
  const day2=await api('/api/quiz/start','POST',{mode:'daily'});assert.deepEqual(day1.questions,day2.questions);log('daily snapshots identical for guests');
  const guestDailyStatus=await api('/api/quiz/daily/status');assert.equal(guestDailyStatus.status,401);
  const user={id:'u-api',email:'player@test.example'};
  await DB.prepare("INSERT INTO users(id,nickname,email,password_hash,password_salt,password_iterations,created_at,updated_at) VALUES('u-api','Utente','player@test.example','hash','salt',210000,datetime('now'),datetime('now'))").run();
  const dailyBefore=await api('/api/quiz/daily/status','GET',undefined,user);
  assert.equal(dailyBefore.status,200);assert.equal(dailyBefore.completed,false);
  assert.equal(dailyBefore.streak,0);assert.equal(dailyBefore.scope,'account');
  const userDaily=await api('/api/quiz/start','POST',{mode:'daily'},user);assert.equal(userDaily.status,200);
  const repeat=await api('/api/quiz/start','POST',{mode:'daily'},user);assert.equal(repeat.status,409);
  const restored=await api('/api/quiz/resume','POST',{},user);assert.equal(restored.status,200);log('one authenticated daily attempt and restore by cookie');
  const attacker=await api('/api/quiz/answer','POST',{sessionToken:restored.sessionToken,position:1,optionIndex:0},{id:'hacker',email:'x@test.example'});
  assert.equal(attacker.status,403);log('account token binding prevents unauthorized play');
  for(let position=1;position<=10;position++){
    const answer=await api('/api/quiz/answer','POST',{sessionToken:restored.sessionToken,position,optionIndex:0},user);
    assert.equal(answer.status,200);
  }
  const completedDaily=await api('/api/quiz/daily/status','GET',undefined,user);
  assert.equal(completedDaily.status,200);assert.equal(completedDaily.completed,true);
  assert.equal(completedDaily.today,catalogue.today);
  assert.equal(completedDaily.total,10);assert.ok(completedDaily.score>=0);
  assert.ok(completedDaily.durationSeconds>=1);assert.equal(completedDaily.streak,1);
  // Streak uses consecutive calendar days, not correct answers; a zero-score day counts.
  const dateBefore=(day)=>new Date(Date.parse(day+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  const yesterday=dateBefore(catalogue.today),twoDaysAgo=dateBefore(yesterday),fourDaysAgo=dateBefore(dateBefore(twoDaysAgo));
  for(const date of [yesterday,twoDaysAgo,fourDaysAgo]){
    await DB.prepare(`INSERT INTO quiz_results(user_id,quiz_date,quiz_slug,score,total,duration_seconds,completed_at)
      VALUES(?,?,'daily',0,10,55,?)`).bind(user.id,date,date+'T12:00:00Z').run();
  }
  const threeDayStreak=await api('/api/quiz/daily/status','GET',undefined,user);
  assert.equal(threeDayStreak.streak,3);assert.equal(threeDayStreak.score,completedDaily.score);
  assert.equal(threeDayStreak.bestStreak,3);
  assert.equal(threeDayStreak.totalDays,4);
  assert.ok(threeDayStreak.recentDays.includes(catalogue.today));
  const otherUser={id:'inactive-player',email:'inactive@test.example'};
  await DB.prepare("INSERT INTO users(id,nickname,email,password_hash,password_salt,password_iterations,created_at,updated_at) VALUES('inactive-player','Inactive','inactive@test.example','hash','salt',210000,datetime('now'),datetime('now'))").run();
  await DB.prepare(`INSERT INTO quiz_results(user_id,quiz_date,quiz_slug,score,total,duration_seconds,completed_at)
    VALUES(?,?,'daily',0,10,66,?)`).bind(otherUser.id,twoDaysAgo,twoDaysAgo+'T12:00:00Z').run();
  const brokenStreak=await api('/api/quiz/daily/status','GET',undefined,otherUser);
  assert.equal(brokenStreak.completed,false);assert.equal(brokenStreak.streak,0);
  log('daily score and consecutive streak come from authenticated D1 rows');
  const rated=await DB.prepare('SELECT COUNT(*) AS total FROM question_rating_dedupe').first();assert.equal(rated.total,10);
  const results=await DB.prepare("SELECT score,total FROM quiz_results WHERE user_id='u-api' AND quiz_slug='daily'").first();assert.equal(results.total,10);log('rating dedupe and account results saved');
  // Opt-in leaderboard: no consent by default and no guest ranking submissions.
  const publicBefore=await api('/api/quiz/daily/leaderboard');
  assert.equal(publicBefore.status,200);
  assert.equal(publicBefore.participants,0);
  assert.equal(publicBefore.entries.length,0);
  assert.equal(publicBefore.viewerOptedIn,false);
  const guestJoin=await api('/api/quiz/daily/leaderboard','POST',{enabled:true});
  assert.equal(guestJoin.status,401);
  const invalidConsent=await api('/api/quiz/daily/leaderboard','POST',{enabled:'true'},user);
  assert.equal(invalidConsent.status,400);
  const beforeConsent=await api('/api/quiz/daily/leaderboard','GET',undefined,user);
  assert.equal(beforeConsent.participants,0);
  assert.equal(beforeConsent.viewerOptedIn,false);
  const join=await api('/api/quiz/daily/leaderboard','POST',{enabled:true},user);
  assert.equal(join.status,200);assert.equal(join.optedIn,true);
  const optedIn=await api('/api/quiz/daily/leaderboard','GET',undefined,user);
  assert.equal(optedIn.viewerOptedIn,true);
  assert.equal(optedIn.participants,1);assert.equal(optedIn.entries.length,1);
  assert.equal(optedIn.viewerRank?.rank,1);
  assert.equal(optedIn.entries[0].score,completedDaily.score);
  assert.match(optedIn.entries[0].alias,/^Giocatore [A-F0-9]{6}$/);
  assert.equal(optedIn.entries[0].isMe,true);
  const guestLeaderboard=await api('/api/quiz/daily/leaderboard');
  assert.equal(guestLeaderboard.entries[0].isMe,false);
  assert.equal(guestLeaderboard.entries[0].alias,optedIn.entries[0].alias);
  for(const payload of [optedIn,guestLeaderboard]) {
    const serial=JSON.stringify(payload);
    assert.ok(!serial.includes('player@test.example'));
    assert.ok(!serial.includes('"user_id"'));
    assert.ok(!serial.includes('"nickname"'));
    assert.ok(!serial.includes('"email"'));
  }
  // Verify score descending and speed ascending with top 20 + the viewer outside the list.
  const extraUsers=Array.from({length:21},(_,i)=>'ranked-player-'+i);
  const fastRows=[];
  for(let i=0;i<extraUsers.length;i++){
    const id=extraUsers[i];
    const time=i+1;
    await DB.prepare(`INSERT INTO users(id,nickname,email,password_hash,password_salt,password_iterations,created_at,updated_at)
      VALUES(?,?,?,'hash','salt',210000,datetime('now'),datetime('now'))`)
      .bind(id,'Test player '+i,'rank'+i+'@test.example').run();
    await DB.prepare(`INSERT INTO quiz_results(user_id,quiz_date,quiz_slug,score,total,duration_seconds,completed_at)
      VALUES(? ,?,'daily',10,10,?,?)`)
      .bind(id,catalogue.today,time,catalogue.today+'T12:00:00Z').run();
    await DB.prepare('INSERT INTO daily_leaderboard_opt_ins(user_id) VALUES(?)').bind(id).run();
    fastRows.push(id);
  }
  const slowUser='slow-day-player';
  await DB.prepare(`INSERT INTO users(id,nickname,email,password_hash,password_salt,password_iterations,created_at,updated_at)
    VALUES(?,'Slow','slow@test.example','hash','salt',210000,datetime('now'),datetime('now'))`)
    .bind(slowUser).run();
  await DB.prepare(`INSERT INTO quiz_results(user_id,quiz_date,quiz_slug,score,total,duration_seconds,completed_at)
    VALUES(? ,?,'daily',0,10,999,?)`)
    .bind(slowUser,catalogue.today,catalogue.today+'T12:00:00Z').run();
  await DB.prepare('INSERT INTO daily_leaderboard_opt_ins(user_id) VALUES(?)').bind(slowUser).run();
  const top=await api('/api/quiz/daily/leaderboard');
  assert.equal(top.participants,23);
  assert.equal(top.entries.length,20);
  assert.deepEqual(top.entries.map(x=>x.rank),Array.from({length:20},(_,i)=>i+1));
  assert.ok(top.entries.every(x=>x.score===10));
  assert.ok(top.entries.every(x=>x.score===10));
  assert.ok(top.entries.every((entry,index)=>index===0 ||
    top.entries[index-1].score>entry.score ||
    (top.entries[index-1].score===entry.score &&
      top.entries[index-1].durationSeconds<=entry.durationSeconds)));
  const outside=await api('/api/quiz/daily/leaderboard','GET',undefined,{id:slowUser,email:'slow@test.example'});
  assert.equal(outside.viewerRank?.rank,23);
  assert.equal(outside.viewerRank?.score,0);
  assert.equal(outside.entries.length,20);
  assert.ok(!outside.entries.some(x=>x.isMe));
  const leave=await api('/api/quiz/daily/leaderboard','POST',{enabled:false},user);
  assert.equal(leave.optedIn,false);
  const afterLeave=await api('/api/quiz/daily/leaderboard','GET',undefined,user);
  assert.equal(afterLeave.viewerOptedIn,false);
  assert.equal(afterLeave.viewerRank,null);
  assert.equal(afterLeave.participants,22);
  const verifyNoConsent=await DB.prepare('SELECT COUNT(*) AS n FROM daily_leaderboard_opt_ins WHERE user_id=?').bind(user.id).first();
  assert.equal(verifyNoConsent.n,0);
  await DB.prepare('DELETE FROM users WHERE id=?').bind(slowUser).run();
  const consentAfterDelete=await DB.prepare('SELECT 1 AS present FROM daily_leaderboard_opt_ins WHERE user_id=?').bind(slowUser).first();
  assert.equal(consentAfterDelete,null);
  log('opt-in only leaderboard, privacy, score/time ranking, outside-top-20 own rank, opt-out and cascade');
  const completedAgain=await api('/api/quiz/start','POST',{mode:'daily'},user);assert.equal(completedAgain.status,409);log('completed daily cannot be replayed');
  const privateReview=await api('/api/admin/questions');assert.equal(privateReview.status,403);
  const admin={id:'admin',email:'admin@test.example'};
  const review=await api('/api/admin/questions?status=published','GET',undefined,admin);assert.equal(review.status,200);
  assert.equal(review.items.length,20);assert.equal(review.total,32);
  assert.equal(review.items[0].options.length,4);log('admin review paginates and requires authentication');
  const filterPage=await api('/api/admin/questions?status=published&limit=5&offset=5&category=scienza','GET',undefined,admin);
  assert.equal(filterPage.status,200);assert.ok(filterPage.items.length<=5);assert.ok(filterPage.items.every(x=>x.category_slug==='scienza'));
  const rejectedPage=await api('/api/admin/questions?status=published&offset=-1','GET',undefined,admin);
  assert.equal(rejectedPage.status,400);log('editorial page boundaries and server-side filters');
  const summary=await api('/api/admin/questions/summary','GET',undefined,admin);
  assert.equal(summary.status,200);assert.ok(summary.counts.some(x=>x.status==='published'));
  const latest=await DB.prepare("SELECT id FROM questions WHERE status='published' LIMIT 1").first();
  const publishedEdit=await api(`/api/admin/questions/${latest.id}/edit`,'PUT',{},admin);
  assert.equal(publishedEdit.status,409);log('published questions immutable');
  const targetId='q_editorial_test_001';
  await DB.prepare(`INSERT INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_url)
    VALUES (?,?,?,'it',?,?,?,?,?,'draft','wikidata',?)`).bind(targetId,'hash_editorial_original_001','scienza',
      'Quale elemento viene indicato con il simbolo H?','L’idrogeno è rappresentato dalla lettera H.',100,'easy','easy','https://www.wikidata.org/wiki/Q556').run();
  for (let index=0; index<4; index++) await DB.prepare(`INSERT INTO question_options(question_id,option_index,answer_text,is_correct) VALUES(?,?,?,?)`)
    .bind(targetId,index,['Idrogeno','Ossigeno','Carbonio','Azoto'][index],index===0?1:0).run();
  const invalidEdit=await api(`/api/admin/questions/${targetId}/edit`,'PUT',{
    revision:1,prompt:'Quale elemento viene indicato con il simbolo H?',explanation:'Questa è una spiegazione abbastanza lunga.',
    category:'scienza',difficulty:'easy',sourceUrl:'https://www.wikidata.org/wiki/Q556',
    answers:['Uno','Uno','Tre','Quattro'],correctIndex:0},admin);
  assert.equal(invalidEdit.status,409);log('duplicate answers blocked at API level');
  const validEdit=await api(`/api/admin/questions/${targetId}/edit`,'PUT',{
    revision:1,prompt:'Quale elemento chimico ha il simbolo H?',explanation:'Il simbolo H identifica l’elemento idrogeno.',
    category:'scienza',difficulty:'medium',sourceUrl:'https://www.wikidata.org/wiki/Q556',
    answers:['Idrogeno','Elio','Carbonio','Litio'],correctIndex:0},admin);
  assert.equal(validEdit.status,200);
  const updated=await DB.prepare('SELECT revision,prompt,effective_difficulty,verified_at FROM questions WHERE id=?').bind(targetId).first();
  assert.equal(updated.revision,2);assert.equal(updated.effective_difficulty,'medium');assert.equal(updated.verified_at,null);
  const staleEdit=await api(`/api/admin/questions/${targetId}/edit`,'PUT',{
    revision:1,prompt:'Quale elemento chimico ha il simbolo H?',explanation:'Il simbolo H identifica l’elemento idrogeno.',
    category:'scienza',difficulty:'medium',sourceUrl:'https://www.wikidata.org/wiki/Q556',
    answers:['Idrogeno','Elio','Carbonio','Litio'],correctIndex:0},admin);
  assert.equal(staleEdit.status,409);log('optimistic revision protects edits');
  const bulk=await api('/api/admin/questions/bulk','POST',{ids:[targetId],action:'review'},admin);
  assert.equal(bulk.status,200);assert.equal(bulk.updated,1);
  const wrongBulk=await api('/api/admin/questions/bulk','POST',{ids:[targetId,targetId],action:'reject'},admin);
  assert.equal(wrongBulk.status,400);
  const hidden=await api('/api/admin/questions/summary');assert.equal(hidden.status,403);
  log('bulk status transitions and admin access boundaries');
  console.log('PASS: quiz API, editorial filters, edit and bulk security tests');
}catch(error){console.error('FAILED:',error);process.exitCode=1;}finally{child.kill();}
