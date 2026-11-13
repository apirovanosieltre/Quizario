#!/usr/bin/env node
/** Generates *draft-only* SQL for 60 original trivia questions. No network or D1 writes. */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const bank=JSON.parse(readFileSync(new URL('../seeds/editorial-20261113.json',import.meta.url),'utf8'));
const quote=(value)=>value===null?'NULL':`'${String(value).replaceAll("'","''")}'`;
const sha=(value)=>createHash('sha256').update(value).digest('hex');
const categories=['storia','sport','cinema','cultura'];
const levels=['easy','medium','hard'];
const batchId='editorial_20261113_60';
const sourceId='quizario-editorial';
const seen=new Set();
const totals=new Map();
if(bank.version!==1||bank.publicationStatus!=='draft'||bank.reviewRequired!==true||bank.questions?.length!==60)
  throw Error('Expected exactly 60 questions marked draft/review required.');
for(const item of bank.questions){
  if(!/^E\\d{2}$/.test(item.id)||seen.has(item.id))throw Error('Duplicate or invalid editorial id '+item.id);
  seen.add(item.id);
  if(!categories.includes(item.category)||!levels.includes(item.difficulty))throw Error('Invalid category or tier '+item.id);
  if(typeof item.prompt!=='string'||item.prompt.trim().length<12||item.prompt.length>500)throw Error('Invalid prompt '+item.id);
  if(typeof item.explanation!=='string'||item.explanation.trim().length<12)throw Error('Insufficient explanation '+item.id);
  if(!Array.isArray(item.options)||item.options.length!==4||
     item.options.some(x=>typeof x!=='string'||!x.trim()||x.length>200)||
     new Set(item.options.map(x=>x.trim().toLocaleLowerCase('it'))).size!==4)
    throw Error('Invalid option choices '+item.id);
  if(!Number.isInteger(item.correctIndex)||item.correctIndex<0||item.correctIndex>3)throw Error('Invalid answer '+item.id);
  if(item.sourceId!==sourceId||typeof item.sourceItemId!=='string'||
     !item.sourceItemId.startsWith('quizario-editorial-')||typeof item.sourceUrl!=='string'||
     !item.sourceUrl.startsWith('https://it.wikipedia.org/wiki/'))
    throw Error('Missing editorial review reference '+item.id);
  const key=item.category+':'+item.difficulty;
  totals.set(key,(totals.get(key)??0)+1);
}
for(const c of categories)for(const d of levels)if(totals.get(c+':'+d)!==5)throw Error('Expected 5 '+c+'/'+d+' questions');
const statements=[
  '-- QUIZARIO: 60 ORIGINAL QUESTIONS FOR HUMAN EDITORIAL REVIEW.',
  '-- Drafts only. DO NOT automatically set verified_at, status=review, or status=published.',
  'PRAGMA foreign_keys=ON;',
  `INSERT OR IGNORE INTO question_sources(id,name,home_url,license_id,license_url,attribution_note)
   VALUES(${quote(sourceId)},'Quizario - domande redazionali originali','https://it.wikipedia.org/', 'Quizario-original',
     'https://github.com/apirovanosieltre/Quizario',
     'Testi originali Quizario; link di approfondimento da verificare a cura della redazione prima di pubblicare. Nessun testo copiato.');`,
  `INSERT OR IGNORE INTO import_batches(id,source_id,recipe,status,attempted,completed_at)
   VALUES(${quote(batchId)},${quote(sourceId)},'original-editorial-60','completed',60,datetime('now'));`,
];
for(const q of bank.questions){
  const id='draft_20261113_'+q.id.toLowerCase();
  const hash=sha('it|'+q.prompt.toLocaleLowerCase('it')+'|'+q.options[q.correctIndex].toLocaleLowerCase('it'));
  const selection=parseInt(hash.slice(0,7),16);
  const columns=['id','content_hash','category_slug','language','prompt','explanation','selection_key',
    'editor_difficulty','effective_difficulty','status','source_id','source_item_id','source_url','import_batch_id','verified_at'];
  const values=[id,hash,q.category,'it',q.prompt,q.explanation,selection,q.difficulty,q.difficulty,'draft',
    sourceId,q.sourceItemId,q.sourceUrl,batchId,null];
  // No changes to existing IDs/content_hash, even if an editor already corrected or rejected a question.
  statements.push(`INSERT OR IGNORE INTO questions(${columns.join(',')})
    SELECT ${values.map((v,i)=>i===6?String(v):quote(v)).join(',')}
    WHERE NOT EXISTS (SELECT 1 FROM questions WHERE source_id=${quote(sourceId)}
       AND source_item_id=${quote(q.sourceItemId)});`);
  for(let i=0;i<4;i++){
    statements.push(`INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
      SELECT ${quote(id)},${i},${quote(q.options[i])},${i===q.correctIndex?1:0}
      WHERE EXISTS(SELECT 1 FROM questions WHERE id=${quote(id)}
      AND import_batch_id=${quote(batchId)} AND revision=1 AND status='draft'
      AND verified_at IS NULL AND content_hash=${quote(hash)});`);
  }
}
const output=resolve(process.argv.find(x=>x.startsWith('--output='))?.slice(9)??'imports/editorial-20261113.sql');
mkdirSync(dirname(output),{recursive:true});
writeFileSync(output,statements.join('\n')+'\n','utf8');
console.log('Generated 60 original Italian draft questions across storia, sport, cinema, cultura: '+output);
