#!/usr/bin/env node
/** Read-only verification of the imported editorial draft bank in remote D1. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
if(!account||!token)throw Error('Cloudflare credentials missing');
const config=JSON.parse(readFileSync(resolve('wrangler.jsonc'),'utf8'));
const db=config.d1_databases.find(item=>item.binding==='DB');
const sql=`SELECT category_slug,effective_difficulty,status,COUNT(*) AS total
 FROM questions WHERE import_batch_id='editorial_20261113_60'
 GROUP BY category_slug,effective_difficulty,status`;
async function query(sql){
  const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${db.database_id}/query`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
    body:JSON.stringify({sql}),signal:AbortSignal.timeout(20000),
  });
  if(!response.ok)throw Error('D1 query HTTP '+response.status);
  const payload=await response.json();
  if(!payload.success||!payload.result?.[0]?.success)throw Error('D1 query returned an error');
  return payload.result[0].results;
}
const rows=await query(sql);
const cat=['storia','sport','cinema','cultura'],levels=['easy','medium','hard'];
for(const c of cat)for(const l of levels){
  const count=rows.filter(r=>r.category_slug===c&&r.effective_difficulty===l)
    .reduce((sum,r)=>sum+Number(r.total),0);
  if(count!==5)throw Error(`Missing editorial questions for ${c}/${l}: ${count}/5`);
}
const integrity=await query(`SELECT COUNT(*) AS total, SUM(CASE WHEN option_count=4 AND correct_count=1 THEN 1 ELSE 0 END) AS valid
FROM (SELECT q.id,COUNT(o.option_index) AS option_count,COALESCE(SUM(o.is_correct),0) AS correct_count
      FROM questions q LEFT JOIN question_options o ON o.question_id=q.id
      WHERE q.import_batch_id='editorial_20261113_60'
      GROUP BY q.id)`);
if(Number(integrity[0]?.total)!==60||Number(integrity[0]?.valid)!==60)
  throw Error('D1 editorial options integrity check failed');
console.log('OK: 60 editorial questions in D1, 4 categories x 3 tiers x 5, option integrity confirmed.');
console.log('Editorial state totals:',JSON.stringify(rows));
