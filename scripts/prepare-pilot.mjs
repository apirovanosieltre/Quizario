#!/usr/bin/env node
/**
 * One-off, source-checked starter quiz bank for November 2026.
 * Does not make network requests or write to D1. Run only for the pilot workflow.
 * The new records become published only after option checks and the D1 publish trigger.
 */
import { createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source=JSON.parse(readFileSync(new URL('../seeds/pilot-questions.json',import.meta.url),'utf8'));
const items=source.questions;
const VERIFIED_AT='2026-11-12T18:00:00Z';
const batches={geografia:'pilot_20261112_geografia',scienza:'pilot_20261112_scienza'};
const IUPAC='https://iupac.org/what-we-do/periodic-table-of-elements/';
const quote=value=>value===null?'NULL':`'${String(value).replaceAll("'","''")}'`;
const sha=value=>createHash('sha256').update(value).digest('hex');
function verifySource(q){
  if(q.sourceId==='wikidata') return q.category==='geografia' && /^Q\d+$/.test(q.sourceItemId) && q.sourceUrl===`https://www.wikidata.org/wiki/${q.sourceItemId}`;
  if(q.sourceId==='quizario-iupac') return q.category==='scienza' && q.sourceUrl===IUPAC && /^iupac-[A-Za-z0-9]+$/.test(q.sourceItemId);
  return false;
}
function assertPilot(questions){
  if(source.version!==1 || source.reviewDate!=='2026-11-12' || questions.length!==30) throw Error('Lotto pilota non atteso (30 domande).');
  const ids=new Set(),prompts=new Set();
  const counts={};
  for(const q of questions){
    const {id,prompt,explanation,category,difficulty,options,correctIndex}=q;
    if(!/^[GS]\d{2}$/.test(id)||ids.has(id))throw Error('ID pilota duplicato/non valido: '+id);
    ids.add(id);
    if(typeof prompt!=='string'||prompt.trim().length<12||prompt.length>500)throw Error('Domanda non valida: '+id);
    const p=prompt.normalize('NFC').toLocaleLowerCase('it');
    if(prompts.has(p))throw Error('Testo duplicato: '+id);
    prompts.add(p);
    if(typeof explanation!=='string'||explanation.trim().length<12)throw Error('Spiegazione insufficiente: '+id);
    if(!['geografia','scienza'].includes(category)||!['easy','medium','hard'].includes(difficulty))throw Error('Categoria/difficoltà invalida: '+id);
    if(!Array.isArray(options)||options.length!==4||options.some(x=>typeof x!=='string'||!x.trim()||x.length>200)||new Set(options.map(x=>x.trim().toLocaleLowerCase('it'))).size!==4)throw Error('Alternative non valide: '+id);
    if(!Number.isInteger(correctIndex)||correctIndex<0||correctIndex>3||!verifySource(q))throw Error('Fonte o risposta errata: '+id);
    counts[category+':'+difficulty]=(counts[category+':'+difficulty]??0)+1;
  }
  for(const category of ['geografia','scienza'])for(const difficulty of ['easy','medium','hard']){
    if(counts[category+':'+difficulty]!==5)throw Error('Devono esserci 5 domande per categoria/difficoltà.');
  }
}
assertPilot(items);
const statements=[
  '-- QUIZARIO PILOT 2026-11: thirty source-checked original Italian questions.',
  '-- Reviewed provenance: Wikidata capital statements, IUPAC periodic table facts.',
  '-- Idempotent and non-destructive: records are inserted as drafts before publish validation.',
  'PRAGMA foreign_keys=ON;',
  `INSERT OR IGNORE INTO question_sources(id,name,home_url,license_id,license_url,attribution_note)
    VALUES('quizario-iupac','Quizario: schede originali verificate su IUPAC',${quote(IUPAC)},'Quizario-original',${quote('https://github.com/apirovanosieltre/Quizario')},'Testo originale Quizario; dati di elementi, numeri atomici e simboli verificati presso IUPAC. Nessuna grafica o tavola riprodotta.');`,
  `INSERT OR IGNORE INTO import_batches (id,source_id,recipe,status,attempted,completed_at)
    VALUES('pilot_20261112_geografia','wikidata','quizario-pilot-geography','completed',15,datetime('now'));`,
  `INSERT OR IGNORE INTO import_batches (id,source_id,recipe,status,attempted,completed_at)
    VALUES('pilot_20261112_scienza','quizario-iupac','quizario-pilot-science','completed',15,datetime('now'));`
];
for(const q of items){
  const id='pilot_20261112_'+q.id.toLowerCase();
  const batch=batches[q.category];
  const hash=sha(`it|${q.prompt.toLocaleLowerCase('it')}|${q.options[q.correctIndex].toLocaleLowerCase('it')}`);
  const number=parseInt(hash.slice(0,7),16);
  const cols=['id','content_hash','category_slug','language','prompt','explanation','selection_key','editor_difficulty','effective_difficulty','status','source_id','source_item_id','source_url','import_batch_id','verified_at'];
  const vals=[id,hash,q.category,'it',q.prompt,q.explanation,number,q.difficulty,q.difficulty,'draft',q.sourceId,q.sourceItemId,q.sourceUrl,batch,VERIFIED_AT];
  statements.push(`INSERT OR IGNORE INTO questions(${cols.join(',')}) VALUES(${vals.map((x,i)=>i===6?String(x):quote(x)).join(',')});`);
  for(let i=0;i<4;i++){
    statements.push(`INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
      SELECT ${quote(id)},${i},${quote(q.options[i])},${i===q.correctIndex?1:0}
      WHERE EXISTS(SELECT 1 FROM questions WHERE id=${quote(id)} AND status='draft' AND revision=1
        AND import_batch_id=${quote(batch)} AND verified_at=${quote(VERIFIED_AT)} AND published_at IS NULL);`);
  }
  // The existing DB trigger requires exactly four options, one correct, verified source and Italian explanation.
  statements.push(`UPDATE questions SET status='published',published_at=COALESCE(published_at,datetime('now')),updated_at=datetime('now')
    WHERE id=${quote(id)} AND status='draft' AND published_at IS NULL AND revision=1
      AND import_batch_id=${quote(batch)} AND verified_at=${quote(VERIFIED_AT)};`);
}
const output=resolve(process.argv.find(x=>x.startsWith('--output='))?.slice(9)??'imports/pilot-20261112.sql');
mkdirSync(dirname(output),{recursive:true});
writeFileSync(output,statements.join('\n')+'\n','utf8');
console.log(`Pronte ${items.length} domande pilota, 15 geografia e 15 scienza, verificate e idempotenti: ${output}`);