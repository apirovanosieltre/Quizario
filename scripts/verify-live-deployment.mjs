#!/usr/bin/env node
/**
 * Validate the real public hostname after a Workers + static assets deployment.
 * No cookies, credentials, or account data required.
 */
const base='https://quizario.cicioweb.app';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function fetchPayload(path,validate){
  const response=await fetch(base+path,{
    headers:{'accept':'application/json'},
    redirect:'follow',
    signal:AbortSignal.timeout(12000),
  });
  const contentType=response.headers.get('content-type')??'';
  if(!response.ok||!contentType.includes('application/json'))
    throw new Error(`${path}: HTTP ${response.status}, content-type ${contentType}`);
  const body=await response.json();
  if(!validate(body))throw new Error(`${path}: unexpected JSON response`);
  return body;
}
async function verify(){
  const health=await fetchPayload('/api/health',x=>x.ok===true&&x.service==='quizario');
  const config=await fetchPayload('/api/security/config',x=>
    typeof x.registrationEnabled==='boolean' &&
    typeof x.passwordResetEnabled==='boolean' &&
    (x.turnstileSiteKey===null||typeof x.turnstileSiteKey==='string')
  );
  const catalog=await fetchPayload('/api/quiz/catalog',x=>Array.isArray(x.categories)&&x.categories.length>0);
  const home=await fetch(base+'/',{signal:AbortSignal.timeout(12000)});
  if(!home.ok || !(home.headers.get('content-type')??'').includes('text/html'))
    throw new Error(`Homepage not served as HTML: HTTP ${home.status}`);
  const html=await home.text();
  if(!/quizario/i.test(html))throw new Error('Homepage does not look like Quizario');
  console.log('PASS: live domain serves full Quizario Worker API and Angular shell.');
  console.log(`Registration: ${config.registrationEnabled?'enabled':'still disabled pending Turnstile configuration'}`);
  console.log(`Password recovery: ${config.passwordResetEnabled?'enabled':'not configured'}`);
  console.log(`Catalog categories: ${catalog.categories.length}`);
  return health;
}
let last;
for(let attempt=1;attempt<=8;attempt++){
  try {await verify();process.exit(0);}
  catch(error){last=error;console.warn(`Live check ${attempt}/8 failed: ${error.message}`);if(attempt<8)await sleep(5000);}
}
console.error('FAILED to verify public domain:',last?.message);
process.exitCode=1;
