import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require(process.env.QUIZARIO_TYPESCRIPT_PATH??'typescript');
const source=readFileSync(new URL('../worker/security.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const dir=mkdtempSync(join(tmpdir(),'quizario-security-'));
const out=join(dir,'security.cjs');writeFileSync(out,js);
const {SecurityError,enforceRateLimit,turnstileReady,passwordResetReady,createResetToken,verifyResetToken,verifyTurnstile}=require(out);
const user={id:'00000000-0000-4000-8000-000000000001',password_hash:'hash-A'};
const secret='this-is-a-test-secret-with-more-than-32-random-ish-characters';
const environment={
  TURNSTILE_SITE_KEY:'test-site-key',TURNSTILE_SECRET_KEY:'test-secret',TURNSTILE_HOSTNAMES:'quizario.test',
  PASSWORD_RESET_SECRET:secret, RESEND_API_KEY:'test-provider',MAIL_FROM:'Quizario <noreply@quizario.test>',PUBLIC_BASE_URL:'https://quizario.test/',
};

test('setup remains disabled unless both Turnstile keys and explicit hostnames are supplied',()=>{
  assert.equal(turnstileReady({}),false);
  assert.equal(turnstileReady({...environment,TURNSTILE_HOSTNAMES:''}),false);
  assert.equal(passwordResetReady({...environment,RESEND_API_KEY:''}),false);
  assert.equal(passwordResetReady({...environment,PUBLIC_BASE_URL:'http://quizario.test/'}),false);
  assert.equal(passwordResetReady(environment),true);
});
test('reset tokens expire, are tamper-proof, and invalidate after changing password',async()=>{
  const issuedAt=Date.now();
  const token=await createResetToken(secret,user,issuedAt);
  const lookup=async id=>id===user.id?user:null;
  assert.equal(await verifyResetToken(secret,token,lookup,issuedAt+1000),user.id);
  assert.equal(await verifyResetToken(secret,token.slice(0,-2)+'zz',lookup,issuedAt+1000),null);
  assert.equal(await verifyResetToken(secret,token,lookup,issuedAt+31*60*1000),null);
  user.password_hash='hash-B';
  assert.equal(await verifyResetToken(secret,token,lookup,issuedAt+1000),null);
  assert.equal(await verifyResetToken('another-secret-with-more-than-32-characters',token,lookup,issuedAt+1000),null);
});
test('rate limits fail closed without binding, reject 429, and key by IP and email separately',async()=>{
  const request=new Request('https://quizario.test/api/auth/login',{headers:{'cf-connecting-ip':'203.0.113.9'}});
  await assert.rejects(()=>enforceRateLimit({},request,'auth'),e=>e instanceof SecurityError&&e.status===503);
  const seen=[];
  const limiter={limit:async({key})=>{seen.push(key);return {success:seen.length<=1};}};
  await assert.rejects(()=>enforceRateLimit({AUTH_RATE:limiter},request,'auth','foo@bar.test'),e=>e.status===429);
  assert.equal(seen.length,2);assert.ok(!seen[0].includes('203.0.113.9'));assert.ok(!seen[1].includes('foo@bar.test'));
});
test('Turnstile requires server success, action and exact allowed hostname',async()=>{
  const original=globalThis.fetch;
  let expected='register';
  try {
    globalThis.fetch=async(_url,init)=>{
      assert.equal(init.method,'POST');
      assert.equal(new URLSearchParams(init.body).get('response'),'test-token');
      return new Response(JSON.stringify({success:true,action:expected,hostname:'quizario.test'}),{status:200});
    };
    const req=new Request('https://quizario.test/api/auth/register');
    await verifyTurnstile(environment,req,'test-token','register');
    expected='login';
    await assert.rejects(()=>verifyTurnstile(environment,req,'test-token','register'),e=>e.status===403);
    await assert.rejects(()=>verifyTurnstile({...environment,TURNSTILE_HOSTNAMES:'another.test'},req,'test-token','register'),e=>e.status===403);
    await assert.rejects(()=>verifyTurnstile(environment,req,'','register'),e=>e.status===400);
  } finally {globalThis.fetch=original;}
});
test('security endpoints and new cookie name are connected to the Worker',()=>{
  const worker=readFileSync(new URL('../worker/index.ts',import.meta.url),'utf8');
  assert.match(worker,/__Host-quizario_session/);
  assert.match(worker,/\/api\/auth\/password\/forgot/);
  assert.match(worker,/\/api\/auth\/password\/reset/);
  assert.match(worker,/verifyTurnstile\(env, request, body\['turnstileToken'\], 'register'\)/);
  assert.match(worker,/enforceRateLimit\(env, request, 'quiz'\)/);
});