#!/usr/bin/env node
/** Verify exactly the one-off public pilot batch. Read only; no writes to D1. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const account=process.env.CLOUDFLARE_ACCOUNT_ID;
const token=process.env.CLOUDFLARE_API_TOKEN;
if(!/^[0-9a-f]{32}$/i.test(account??'')||!token)throw Error('Mancano secrets Cloudflare per verificare D1.');
const config=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const db=config.d1_databases.find(x=>x.binding==='DB');
if(!db)throw Error('Binding D1 non trovato.');
const sql=`SELECT category_slug,effective_difficulty,COUNT(*) AS total FROM questions
  WHERE import_batch_id IN ('pilot_20261112_geografia','pilot_20261112_scienza')
    AND status='published'
  GROUP BY category_slug,effective_difficulty ORDER BY category_slug,effective_difficulty`;
const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
let response;
try{
 response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${db.database_id}/query`,{
   method:'POST',headers:{Authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql}),signal:controller.signal,
 });
}finally{clearTimeout(timeout);}
if(!response.ok)throw Error(`Lettura D1 fallita: HTTP ${response.status}`);
const parsed=await response.json();
if(parsed?.success===false||!Array.isArray(parsed?.result?.[0]?.results))throw Error('Risposta query D1 non valida.');
const rows=parsed.result[0].results;
const categories=['geografia','scienza'],tiers=['easy','medium','hard'];
for(const category of categories)for(const tier of tiers){
 const count=Number(rows.find(x=>x.category_slug===category&&x.effective_difficulty===tier)?.total??0);
 if(count!==5)throw Error(`Pilota incompleto: ${category}/${tier} = ${count} (atteso 5).`);
}
if(rows.length!==6)throw Error('Distribuzione domande pilota imprevista.');
console.log('OK: 30 domande pilota pubblicate su D1 remoto (15 Geografia, 15 Scienza; 10 per difficoltà).');
console.log('Quiz libero: ogni categoria >=15 domande. Sfida giornaliera: 3 easy/4 medium/3 hard disponibili.');