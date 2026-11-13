#!/usr/bin/env node
/** Cloudflare D1 read-only check after the leaderboard schema repair. */
import { readFileSync } from 'node:fs';
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
if(!account||!token)throw Error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN.');
const cfg=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const db=cfg.d1_databases.find(x=>x.binding==='DB');
const resp=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${db.database_id}/query`,{
  method:'POST',
  headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},
  body:JSON.stringify({sql:`SELECT sql FROM sqlite_master WHERE type='table' AND name='daily_leaderboard_opt_ins'`}),
  signal:AbortSignal.timeout(20000),
});
if(!resp.ok)throw Error('D1 schema verification HTTP '+resp.status);
const body=await resp.json();
if(!body.success||!body.result?.[0]?.success||body.result[0].results?.length!==1)
  throw Error('D1 leaderboard schema not present.');
const sql=body.result[0].results[0].sql;
if(!sql.includes('user_id')||!sql.includes('REFERENCES users'))
  throw Error('D1 leaderboard opt-in foreign key missing.');
console.log('OK: opt-in leaderboard table exists with foreign key to accounts.');
