#!/usr/bin/env node
/** LOCAL QA ONLY. Do not deploy these example records. No claim of source verification. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {createHash} from 'node:crypto';
if(!process.argv.includes('--ack-local-only')){
  throw new Error('Questo seed contiene esempi didattici NON verificati per la produzione. Usa --ack-local-only solo per test D1 locali.');
}
const data=JSON.parse(await readFile(new URL('../examples/quiz-qa-sample.json',import.meta.url),'utf8'));
const out=resolve('imports/qa-only-local.sql');
const sha=x=>createHash('sha256').update(x).digest('hex');
const quote=x=>`'${String(x).replaceAll("'","''")}'`;
const statements=[
  '-- DATASET ESCLUSIVAMENTE PER TEST LOCALI. NON IMPORTARE SU D1 REMOTO.',
  `INSERT OR IGNORE INTO question_sources(id,name,home_url,license_id,license_url,attribution_note)
     VALUES('qa-fixture','Esempi originali per QA locale','https://www.wikidata.org/','INTERNAL-QA-ONLY','https://www.wikidata.org/','Non verificati, mai pubblicare questo seed in produzione.');`,
];
for(const [index,q] of data.entries()){
  const h=sha(q.category+'|'+q.prompt);
  const id='qa_'+h.slice(0,24);
  const opts=q.options.map(v=>v.trim());
  if(opts.length!==4||new Set(opts.map(x=>x.toLocaleLowerCase('it'))).size!==4)throw new Error(`Scelte duplicate per ${id}`);
  const choices=[id,h,q.category,'it',q.prompt,q.explanation,parseInt(h.slice(0,7),16),q.difficulty,q.difficulty,'published','qa-fixture',`QA-${index+1}`,'https://www.wikidata.org/',`local QA record (not source-verified)`];
  // Insert draft first; explicit status transition exercises the publish trigger.
  const draft=[...choices];draft[9]='draft';
  statements.push(`INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES (${draft.map((v,j)=>j===6?String(v):quote(v)).join(',')});`);
  opts.forEach((text,n)=>statements.push(`INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT ${quote(id)},${n},${quote(text)},${n===q.answer?1:0} WHERE EXISTS(SELECT 1 FROM questions WHERE id=${quote(id)} AND status='draft');`));
  statements.push(`UPDATE questions SET status='published',published_at=datetime('now') WHERE id=${quote(id)} AND status='draft';`);
}
await mkdir(dirname(out),{recursive:true});
await writeFile(out,statements.join('\n')+'\n','utf8');
console.log(`Pronte ${data.length} domande DEMO originali, non verificate, solo per il database LOCALE: ${out}`);
