#!/usr/bin/env node
/**
 * Quizario: IMPORT ONLY. All incoming questions have status=draft.
 * Sources: Wikidata CC0 (Italian facts) or OpenTDB CC BY-SA 4.0 (English draft).
 * Export idempotent SQL for D1, without connecting to the production DB.
 * Node 22+, no third-party dependencies.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const args = Object.fromEntries(process.argv.slice(2).filter(s => s.startsWith('--')).map(s => {
  const pos = s.indexOf('=');
  return pos < 0 ? [s.slice(2), 'true'] : [s.slice(2,pos), s.slice(pos+1)];
}));
const dataset = args.dataset ?? 'capitals';
const limit = Number(args.limit ?? 50);
const output = resolve(args.output ?? `imports/${dataset}.sql`);
if (!['capitals','currencies','elements','symbols','opentdb'].includes(dataset)) throw Error('dataset deve essere capitals, currencies, elements, symbols o opentdb');
if (!Number.isInteger(limit) || limit < 1 || limit > 200) throw Error('limit deve essere tra 1 e 200');

const sha = s => createHash('sha256').update(s).digest('hex');
const sql = s => s == null ? 'NULL' : `'${String(s).replaceAll("'", "''")}'`;
const clean = s => String(s ?? '').replace(/\s+/g,' ').trim().normalize('NFC');
const qid = url => /^https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)$/.exec(url ?? '')?.[1] ?? null;
const rank = (seed, item) => sha(`${seed}:${item}`);
const EASY_CAPITALS = new Set(['Q142','Q38','Q183','Q29','Q145','Q17','Q148','Q159','Q30','Q55','Q34','Q16','Q40','Q45','Q96','Q668']);

function makeWikidataQuestions(data) {
  const byEntity = new Map();
  for (const b of data?.results?.bindings ?? []) {
    const key = qid(b.country?.value ?? b.element?.value);
    const label = clean(b.countryLabel?.value ?? b.elementLabel?.value);
    const answer = clean(dataset==='currencies' ? b.currencyLabel?.value :
      dataset==='symbols' ? b.symbol?.value : (b.capitalLabel?.value ?? b.elementLabel?.value));
    const target = dataset==='capitals' ? qid(b.capital?.value) :
      dataset==='currencies' ? qid(b.currency?.value) : Number(b.atomicNumber?.value);
    if (!key || !label || !answer || !target) continue;
    if (['elements','symbols'].includes(dataset) && (!Number.isInteger(target) || target < 1 || target > 118)) continue;
    if (dataset==='symbols' && !/^[A-Z][a-z]?$/.test(answer)) continue;
    const entry = { key, label, answer, target };
    const existing = byEntity.get(key);
    if (!existing) byEntity.set(key, [entry]);
    else existing.push(entry);
  }
  // Only keep one-capital countries / single-number elements; skip ambiguous cases.
  const rows = Array.from(byEntity.values()).filter(entries =>
    entries.length > 0 && new Set(entries.map(e=>String(e.target))).size === 1
  ).map(entries=>entries[0]);
  const candidates = rows.sort((a,b)=>a.key.localeCompare(b.key));
  const questions = [];
  for (const row of candidates) {
    const category = ['capitals','currencies'].includes(dataset) ? 'geografia' : 'scienza';
    const prompt = dataset==='capitals'
      ? `Paese: ${row.label}. Qual è la capitale?`
      : dataset==='currencies' ? `Paese: ${row.label}. Qual è la valuta?`
      : dataset==='symbols' ? `Qual è il simbolo chimico dell'elemento ${row.label}?`
      : `Quale elemento chimico ha numero atomico ${row.target}?`;
    const explanation = dataset==='capitals'
      ? `La capitale del Paese indicato è ${row.answer}.`
      : dataset==='currencies' ? `La valuta associata al Paese indicato è ${row.answer}.`
      : dataset==='symbols' ? `Il simbolo chimico dell'elemento ${row.label} è ${row.answer}.`
      : `Il numero atomico ${row.target} identifica l'elemento ${row.answer}.`;
    const difficulty = ['capitals','currencies'].includes(dataset)
      ? (EASY_CAPITALS.has(row.key) ? 'easy' : 'medium')
      : (row.target <= 20 ? 'easy' : row.target <= 50 ? 'medium' : 'hard');
    // Distractors must be other unique correct answers of the same data type.
    // For chemistry, favor neighboring atomic numbers; for capitals, shuffle deterministically.
    const other = candidates.filter(c=> c.key!==row.key && c.answer.toLocaleLowerCase('it')!==row.answer.toLocaleLowerCase('it'));
    other.sort((a,b)=>{
      if (['elements','symbols'].includes(dataset)) {
        const d = Math.abs(a.target-row.target) - Math.abs(b.target-row.target);
        if (d) return d;
      }
      return rank(row.key,a.key).localeCompare(rank(row.key,b.key));
    });
    const unique = [...new Map(other.map(e=>[e.answer.toLocaleLowerCase('it'),e.answer])).values()].slice(0,3);
    if (unique.length!==3) continue;
    const choices = [row.answer,...unique].sort((a,b)=>rank(row.key,a).localeCompare(rank(row.key,b)));
    questions.push({ category, language:'it', prompt, explanation, difficulty,
      options: choices.map(answerText=>({text:answerText, correct: answerText===row.answer})),
      source:'wikidata', sourceItem:row.key, sourceUrl:`https://www.wikidata.org/wiki/${row.key}` });
    if (questions.length>=limit) break;
  }
  return questions;
}

function makeOpenTdbQuestions(data) {
  const mapCategory = text => {
    const lower = clean(text).toLowerCase();
    if (lower.includes('history')) return 'storia';
    if (lower.includes('geography')) return 'geografia';
    if (lower.includes('science')) return 'scienza';
    if (lower.includes('sports')) return 'sport';
    if (lower.includes('film') || lower.includes('television')) return 'cinema';
    return 'cultura';
  };
  const decode = s => Buffer.from(String(s ?? ''),'base64').toString('utf8');
  return (data?.results ?? []).filter(r=>r.type==='multiple' && r.incorrect_answers?.length===3)
    .slice(0,limit).map(r=>{
      const prompt = clean(decode(r.question));
      const answer = clean(decode(r.correct_answer));
      const wrong = r.incorrect_answers.map(x=>clean(decode(x)));
      if (!prompt || !answer || new Set([answer,...wrong].map(x=>x.toLowerCase())).size!==4) return null;
      const key=sha(prompt+':'+answer);
      const options=[answer,...wrong].sort((a,b)=>rank(key,a).localeCompare(rank(key,b)));
      return { category:mapCategory(decode(r.category)), language:'en', prompt,
        explanation:null, difficulty:['easy','medium','hard'].includes(decode(r.difficulty))?decode(r.difficulty):'medium',
        options:options.map(text=>({text,correct:text===answer})), source:'opentdb', sourceItem:key,
        sourceUrl:'https://opentdb.com/' };
    }).filter(Boolean);
}

function renderSql(questions) {
  const batchKey=`imp_${dataset}_${sha(questions.map(q=>q.sourceItem).join(':')).slice(0,16)}`;
  const source=dataset==='opentdb'?'opentdb':'wikidata';
  const out=[
    '-- Quizario question imports: all records DRAFT. Review and translate before publishing.',
    '-- Idempotent: INSERT OR IGNORE. Existing editorial changes remain intact.',
    `INSERT OR IGNORE INTO import_batches (id,source_id,recipe,status,attempted,completed_at) VALUES (${sql(batchKey)},${sql(source)},${sql(dataset)},'completed',${questions.length},datetime('now'));`,
  ];
  for (const q of questions) {
    const contentHash=sha(`${q.language}|${q.prompt.toLocaleLowerCase()}|${q.options.find(o=>o.correct)?.text.toLocaleLowerCase()}`);
    const id=`q_${contentHash.slice(0,24)}`;
    const cols=['id','content_hash','category_slug','language','prompt','explanation','selection_key','editor_difficulty','effective_difficulty','status','source_id','source_item_id','source_url','import_batch_id','verified_at'];
    const vals=[id,contentHash,q.category,q.language,q.prompt,q.explanation,parseInt(contentHash.slice(0,7),16),q.difficulty,q.difficulty,'draft',q.source,q.sourceItem,q.sourceUrl,batchKey,null];
    // Preserve edited drafts even if a later import would produce the original text again.
    // The source item may be used by multiple recipes, so dedupe within the recipe.
    out.push(`INSERT OR IGNORE INTO questions (${cols.join(',')}) SELECT ${vals.map(sql).join(',')}
  WHERE NOT EXISTS (SELECT 1 FROM questions existing
    LEFT JOIN import_batches batch ON batch.id=existing.import_batch_id
    WHERE existing.source_id=${sql(q.source)} AND existing.source_item_id=${sql(q.sourceItem)}
      AND batch.recipe=${sql(dataset)});`);
    q.options.forEach((choice,index)=>out.push(`INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT ${sql(id)},${index},${sql(choice.text)},${choice.correct?1:0}
  WHERE EXISTS (SELECT 1 FROM questions WHERE id=${sql(id)} AND status='draft' AND content_hash=${sql(contentHash)});`));
  }
  return out.join('\n')+'\n';
}

async function fetchWithRetry(url,headers) {
  for (let count=0;count<3;count++) {
    const res=await fetch(url,{headers,signal:AbortSignal.timeout(45000)});
    if (res.ok) return res.json();
    if (res.status!==429 && res.status<500) throw Error(`HTTP ${res.status}: import interrotto`);
    const wait=Math.min(30000,Number(res.headers.get('retry-after') ?? '3')*1000);
    await new Promise(r=>setTimeout(r,wait));
  }
  throw Error('Richieste bloccate o servizio non disponibile. Riprovare più tardi.');
}

async function getInput() {
  if (args.fixture) return JSON.parse(await readFile(resolve(args.fixture),'utf8'));
  if (dataset==='opentdb') {
    const url=`https://opentdb.com/api.php?amount=${Math.min(limit,50)}&type=multiple&encode=base64`;
    const data=await fetchWithRetry(url,{'accept':'application/json'});
    if (data.response_code!==0) throw Error(`OpenTDB response_code=${data.response_code}`);
    return data;
  }
  // Wikimedia requires a descriptive, identifiable User-Agent for automated clients.
  const agent=process.env.QUIZARIO_USER_AGENT;
  if (!agent || !agent.includes('contact:')) throw Error('Definisci QUIZARIO_USER_AGENT="QuizarioImporter/0.2 (https://tuosito.it; contact: email@dominio.it)"');
  const query = dataset==='capitals' ? `
SELECT ?country ?countryLabel ?capital ?capitalLabel WHERE {
  ?country wdt:P31 wd:Q3624078; wdt:P36 ?capital; rdfs:label ?countryLabel.
  ?capital rdfs:label ?capitalLabel.
  FILTER(LANG(?countryLabel)="it" && LANG(?capitalLabel)="it")
} LIMIT 400` : dataset==='currencies' ? `
SELECT ?country ?countryLabel ?currency ?currencyLabel WHERE {
  ?country wdt:P31 wd:Q3624078; wdt:P38 ?currency; rdfs:label ?countryLabel.
  ?currency rdfs:label ?currencyLabel.
  FILTER(LANG(?countryLabel)="it" && LANG(?currencyLabel)="it")
} LIMIT 400` : dataset==='symbols' ? `
SELECT ?element ?elementLabel ?atomicNumber ?symbol WHERE {
  ?element wdt:P31 wd:Q11344; wdt:P1086 ?atomicNumber; wdt:P246 ?symbol; rdfs:label ?elementLabel.
  FILTER(LANG(?elementLabel)="it")
} LIMIT 160` : `
SELECT ?element ?elementLabel ?atomicNumber WHERE {
  ?element wdt:P31 wd:Q11344; wdt:P1086 ?atomicNumber; rdfs:label ?elementLabel.
  FILTER(LANG(?elementLabel)="it")
} LIMIT 160`;
  const url='https://query.wikidata.org/sparql?'+new URLSearchParams({query,format:'json'});
  return fetchWithRetry(url,{
    'accept':'application/sparql-results+json','user-agent':agent,
    'accept-encoding':'gzip, deflate',
  });
}

const input=await getInput();
const questions=dataset==='opentdb' ? makeOpenTdbQuestions(input) : makeWikidataQuestions(input);
if (!questions.length) throw Error('Nessuna domanda generata: fonte vuota o dati ambigui.');
await mkdir(dirname(output),{recursive:true});
await writeFile(output,renderSql(questions),'utf8');
console.log(`Preparate ${questions.length} domande ${dataset} (${dataset==='opentdb'?'EN':'IT'}), tutte in stato DRAFT. SQL: ${output}`);
