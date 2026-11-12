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
  assert.deepEqual(Object.keys(mixed.questions[0]).sort(),['difficulty','id','options','prompt']);log('no answer key leaks at start');
  const outOfOrder=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position:2,optionIndex:1});
  assert.equal(outOfOrder.status,409);log('answers must be sequential');
  const wrongToken=await api('/api/quiz/answer','POST',{sessionToken:'0'.repeat(64),position:1,optionIndex:0});
  assert.equal(wrongToken.status,401);log('session token enforced');
  const answered=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position:1,optionIndex:0});
  assert.equal(answered.status,200);assert.ok(Number.isInteger(answered.correctOptionIndex));
  const dup=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position:1,optionIndex:0});assert.equal(dup.status,409);log('answer replay blocked');
  const resume=await api('/api/quiz/resume','POST',{sessionToken:mixed.sessionToken});assert.equal(resume.nextPosition,2);log('resume after reload');
  for(let position=2;position<=5;position++){
    const result=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position,optionIndex:0});assert.equal(result.status,200);
    if(position===5)assert.equal(result.completed,true);
  }
  const after=await api('/api/quiz/answer','POST',{sessionToken:mixed.sessionToken,position:5,optionIndex:0});assert.equal(after.status,409);log('server-calculated completion');
  const day1=await api('/api/quiz/start','POST',{mode:'daily'});assert.equal(day1.status,200);assert.equal(day1.questions.length,10);
  assert.deepEqual(day1.questions.map(x=>x.difficulty),['easy','easy','easy','medium','medium','medium','medium','hard','hard','hard']);
  const day2=await api('/api/quiz/start','POST',{mode:'daily'});assert.deepEqual(day1.questions,day2.questions);log('daily snapshots identical for guests');
  const user={id:'u-api',email:'player@test.example'};
  await DB.prepare("INSERT INTO users(id,nickname,email,password_hash,password_salt,password_iterations,created_at,updated_at) VALUES('u-api','Utente','player@test.example','hash','salt',210000,datetime('now'),datetime('now'))").run();
  const userDaily=await api('/api/quiz/start','POST',{mode:'daily'},user);assert.equal(userDaily.status,200);
  const repeat=await api('/api/quiz/start','POST',{mode:'daily'},user);assert.equal(repeat.status,409);
  const restored=await api('/api/quiz/resume','POST',{},user);assert.equal(restored.status,200);log('one authenticated daily attempt and restore by cookie');
  const attacker=await api('/api/quiz/answer','POST',{sessionToken:restored.sessionToken,position:1,optionIndex:0},{id:'hacker',email:'x@test.example'});
  assert.equal(attacker.status,403);log('account token binding prevents unauthorized play');
  for(let position=1;position<=10;position++){
    const answer=await api('/api/quiz/answer','POST',{sessionToken:restored.sessionToken,position,optionIndex:0},user);
    assert.equal(answer.status,200);
  }
  const rated=await DB.prepare('SELECT COUNT(*) AS total FROM question_rating_dedupe').first();assert.equal(rated.total,10);
  const results=await DB.prepare("SELECT score,total FROM quiz_results WHERE user_id='u-api' AND quiz_slug='daily'").first();assert.equal(results.total,10);log('rating dedupe and account results saved');
  const completedAgain=await api('/api/quiz/start','POST',{mode:'daily'},user);assert.equal(completedAgain.status,409);log('completed daily cannot be replayed');
  const privateReview=await api('/api/admin/questions');assert.equal(privateReview.status,403);
  const admin={id:'admin',email:'admin@test.example'};
  const review=await api('/api/admin/questions?status=published','GET',undefined,admin);assert.equal(review.status,200);
  assert.equal(review.items.length,32);assert.equal(review.items[0].options.length,4);log('admin review is protected');
  console.log('PASS: 12 API scenarios and 6 SQLite integration tests');
}catch(error){console.error('FAILED:',error);process.exitCode=1;}finally{child.kill();}
