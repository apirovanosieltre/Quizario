/** Server-authoritative quiz play and editorial review for Cloudflare D1. */
export interface QuizEnv {
  DB: D1Database;
  ADMIN_EMAILS?: string;
  RATING_PEPPER?: string;
}
export interface Player { id: string; email: string; }

export class QuizError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function reply(data: unknown, status=200): Response {
  return new Response(JSON.stringify(data), { status, headers: {
    'content-type':'application/json; charset=utf-8', 'cache-control':'no-store',
    'x-content-type-options':'nosniff', 'referrer-policy':'no-referrer',
  }});
}
function requireString(value: unknown, name: string, limit=128): string {
  if (typeof value!=='string' || !value.trim() || value.length>limit) throw new QuizError(400, `${name} non valido.`);
  return value.trim();
}
function isDifficulty(value: unknown): value is 'easy'|'medium'|'hard'|'mixed' {
  return value==='easy'||value==='medium'||value==='hard'||value==='mixed';
}
async function requestJson(request: Request): Promise<Record<string,unknown>> {
  if (!(request.headers.get('content-type')??'').toLowerCase().startsWith('application/json')) throw new QuizError(415,'Invia una richiesta JSON.');
  const raw = await request.text();
  if(raw.length>4096) throw new QuizError(413,'Richiesta troppo grande.');
  let body: unknown;
  try { body=JSON.parse(raw); } catch { throw new QuizError(400,'JSON non valido.'); }
  if (!body || typeof body!=='object'||Array.isArray(body)) throw new QuizError(400,'JSON non valido.');
  return body as Record<string, unknown>;
}
function romeDay(date=new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const get=(type:string)=>parts.find(x=>x.type===type)?.value??'';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
/** Exclusive end of the current Europe/Rome day, including DST changes. */
function nextRomeMidnight(now:Date):string {
  const day=romeDay(now);
  let low=now.getTime(),high=low+27*3600_000;
  while(high-low>1000){
    const mid=Math.floor((low+high)/2);
    if(romeDay(new Date(mid))===day)low=mid;
    else high=mid;
  }
  return new Date(high).toISOString();
}
function hashSelection(value:string):number {
  let h=2166136261;
  for(const ch of value){ h^=ch.charCodeAt(0);h=Math.imul(h,16777619); }
  return h>>>0;
}
function newToken():string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), n=>n.toString(16).padStart(2,'0')).join('');
}
async function digest(value:string):Promise<string> {
  const bits=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bits),n=>n.toString(16).padStart(2,'0')).join('');
}
async function keyedVoter(id:string,pepper:string):Promise<string> {
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`quizario:v1:${id}`));
  return Array.from(new Uint8Array(signature),n=>n.toString(16).padStart(2,'0')).join('');
}
interface QuestionId { id:string; }
interface QuestionRow {
  id:string; prompt:string; difficulty:string; position:number;
  option_index:number; answer_text:string;
}
interface PlayRow {
  id:string; user_id:string|null; mode:'free'|'daily'; quiz_date:string|null;
  category_slug:string|null; requested_difficulty:string|null;
  started_at:string; expires_at:string; completed_at:string|null;
}
async function selectQuestions(db:D1Database, count:number, category:string|null, difficulty:string|null, seed:string):Promise<string[]> {
  // Indexed range scan with one wraparound, not ORDER BY RANDOM() over the full question bank.
  const pivot=hashSelection(seed)%2147483648;
  const where=`status='published' AND language='it' ${category?"AND category_slug=?":''} ${difficulty?"AND effective_difficulty=?":''}`;
  const params=[...(category?[category]:[]),...(difficulty?[difficulty]:[])];
  const first=await db.prepare(`SELECT id FROM questions WHERE ${where} AND selection_key>=? ORDER BY selection_key,id LIMIT ?`)
    .bind(...params,pivot,count).all<QuestionId>();
  const ids=(first.results??[]).map(x=>x.id);
  if(ids.length<count){
    const rest=await db.prepare(`SELECT id FROM questions WHERE ${where} AND selection_key<? ORDER BY selection_key,id LIMIT ?`)
      .bind(...params,pivot,count-ids.length).all<QuestionId>();
    ids.push(...(rest.results??[]).map(x=>x.id));
  }
  return ids;
}
async function ensureDaily(db:D1Database, day:string):Promise<string[]> {
  const existing=await db.prepare('SELECT question_id AS id FROM daily_quiz_questions WHERE quiz_date=? ORDER BY position').bind(day).all<QuestionId>();
  if((existing.results??[]).length===10) return (existing.results??[]).map(x=>x.id);
  if((existing.results??[]).length!==0) throw new QuizError(503,'Sfida in preparazione, riprova più tardi.');
  const tiers:[string,number][]=[['easy',3],['medium',4],['hard',3]];
  const ids:string[]=[];
  for(const [tier,count] of tiers){
    const chosen=await selectQuestions(db,count,null,tier,`${day}:${tier}`);
    if(chosen.length!==count) throw new QuizError(503,'La sfida giornaliera non è ancora disponibile: servono almeno 3 domande facili, 4 medie e 3 difficili pubblicate.');
    ids.push(...chosen);
  }
  // D1 batch is transactional; concurrent identical generators use INSERT OR IGNORE.
  await db.batch(ids.map((id,i)=>db.prepare(`INSERT OR IGNORE INTO daily_quiz_questions
    (quiz_date,position,question_id,tier_snapshot) VALUES (?,?,?,?)`).bind(day,i+1,id,i<3?'easy':i<7?'medium':'hard')));
  const verified=await db.prepare('SELECT question_id AS id FROM daily_quiz_questions WHERE quiz_date=? ORDER BY position').bind(day).all<QuestionId>();
  if((verified.results??[]).length!==10) throw new QuizError(503,'La sfida è in preparazione.');
  return (verified.results??[]).map(x=>x.id);
}
async function publicQuestions(db:D1Database,sessionId:string) {
  const rows=await db.prepare(`SELECT sa.position,q.id,q.prompt,COALESCE(dq.tier_snapshot,q.effective_difficulty) AS difficulty,o.option_index,o.answer_text
    FROM quiz_session_answers sa JOIN questions q ON q.id=sa.question_id
    JOIN quiz_play_sessions ps ON ps.id=sa.session_id
    LEFT JOIN daily_quiz_questions dq ON dq.quiz_date=ps.quiz_date AND dq.position=sa.position
    JOIN question_options o ON o.question_id=q.id WHERE sa.session_id=?
    ORDER BY sa.position,o.option_index`).bind(sessionId).all<QuestionRow>();
  const result:{id:string;prompt:string;difficulty:string;options:string[]}[]=[];
  for(const row of rows.results??[]){
    if(row.option_index===0) result.push({id:row.id,prompt:row.prompt,difficulty:row.difficulty,options:[]});
    const current=result.at(-1);if(current)current.options.push(row.answer_text);
  }
  return result;
}
async function start(request:Request,env:QuizEnv,user:Player|null):Promise<Response>{
  const body=await requestJson(request);
  const mode=body['mode'];
  if(mode!=='daily'&&mode!=='free') throw new QuizError(400,'Modalità non valida.');
  const day=romeDay();
  let category:string|null=null;let difficulty:string|null=null;
  let count=10;let ids:string[];
  if(mode==='daily'){
    if(user){
      const finished=await env.DB.prepare("SELECT score FROM quiz_results WHERE user_id=? AND quiz_date=? AND quiz_slug='daily'").bind(user.id,day).first();
      if(finished)throw new QuizError(409,'Hai già completato la sfida di oggi. Torna domani per nuove domande.');
      const prior=await env.DB.prepare("SELECT completed_at,expires_at FROM quiz_play_sessions WHERE user_id=? AND mode='daily' AND quiz_date=?")
        .bind(user.id,day).first<{completed_at:string|null;expires_at:string}>();
      if(prior){
        if(!prior.completed_at && prior.expires_at>new Date().toISOString())
          throw new QuizError(409,'Hai già una sfida iniziata. Usa Riprendi per continuare.');
        throw new QuizError(409,'Hai già utilizzato il tentativo giornaliero di oggi.');
      }
    }
    ids=await ensureDaily(env.DB,day);
  }else{
    category=body['category']==null?null:requireString(body['category'],'Categoria',40);
    difficulty=body['difficulty']==null?'mixed':String(body['difficulty']);
    if(!isDifficulty(difficulty))throw new QuizError(400,'Difficoltà non valida.');
    const n=body['count']??10;
    if(!Number.isInteger(n)||![5,10,15].includes(n as number))throw new QuizError(400,'Scegli 5, 10 o 15 domande.');
    count=n as number;
    if(category){
      const found=await env.DB.prepare('SELECT slug FROM question_categories WHERE slug=? AND enabled=1').bind(category).first();
      if(!found)throw new QuizError(400,'Categoria non disponibile.');
    }
    ids=await selectQuestions(env.DB,count,category,difficulty==='mixed'?null:difficulty,crypto.randomUUID());
    if(ids.length<count)throw new QuizError(409,`Non ci sono ancora ${count} domande pubblicate con questi filtri. Prova con meno domande o difficoltà mista.`);
  }
  const sessionId=crypto.randomUUID();const token=newToken();const now=new Date();
  // Generous daily expiry: sessions survive reloads but never extend into the next day's ranking.
  const expires=mode==='daily'?nextRomeMidnight(now):new Date(now.getTime()+4*3600_000).toISOString();
  try{ await env.DB.batch([
    env.DB.prepare(`INSERT INTO quiz_play_sessions (id,user_id,mode,quiz_date,category_slug,requested_difficulty,session_token_hash,started_at,expires_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).bind(sessionId,user?.id??null,mode,mode==='daily'?day:null,category,difficulty,await digest(token),now.toISOString(),expires),
    ...ids.map((id,i)=>env.DB.prepare(`INSERT INTO quiz_session_answers(session_id,position,question_id) VALUES (?,?,?)`).bind(sessionId,i+1,id)),
  ]);}catch(e){
    if(mode==='daily'&&user&&String(e).includes('UNIQUE'))
      throw new QuizError(409,'La sfida giornaliera è già stata avviata da questo account.');
    throw e;
  }
  return reply({ sessionToken:token, mode, date:mode==='daily'?day:null, questions:await publicQuestions(env.DB,sessionId), nextPosition:1, score:0 });
}
async function getSession(db:D1Database,token:unknown,user:Player|null):Promise<PlayRow>{
  const hash=await digest(requireString(token,'Sessione',64));
  const found=await db.prepare('SELECT * FROM quiz_play_sessions WHERE session_token_hash=?').bind(hash).first<PlayRow>();
  if(!found)throw new QuizError(401,'Sessione non valida: avvia un nuovo quiz.');
  if(found.user_id!==null && found.user_id!==user?.id)throw new QuizError(403,'Sessione di un altro utente.');
  if(found.expires_at<=new Date().toISOString())throw new QuizError(410,'Questa partita è scaduta.');
  return found;
}
async function resume(request:Request,env:QuizEnv,user:Player|null):Promise<Response>{
  const body=await requestJson(request);
  let found:PlayRow;
  let token:string;
  if(body['sessionToken']){
    token=requireString(body['sessionToken'],'Sessione',64);
    found=await getSession(env.DB,token,user);
  }else{
    if(!user)throw new QuizError(401,'Accedi per recuperare la sfida giornaliera.');
    found=(await env.DB.prepare("SELECT * FROM quiz_play_sessions WHERE user_id=? AND mode='daily' AND quiz_date=? AND completed_at IS NULL AND expires_at>? ORDER BY started_at DESC LIMIT 1")
      .bind(user.id,romeDay(),new Date().toISOString()).first<PlayRow>())!;
    if(!found)throw new QuizError(404,'Non ci sono sfide da riprendere.');
    token=newToken();
    await env.DB.prepare('UPDATE quiz_play_sessions SET session_token_hash=? WHERE id=?').bind(await digest(token),found.id).run();
  }
  const status=await env.DB.prepare(`SELECT COUNT(*) AS answered,COALESCE(SUM(CASE WHEN is_correct=1 THEN 1 ELSE 0 END),0) AS score
    FROM quiz_session_answers WHERE session_id=? AND selected_option_index IS NOT NULL`).bind(found.id).first<{answered:number;score:number}>();
  const total=await env.DB.prepare('SELECT COUNT(*) AS total FROM quiz_session_answers WHERE session_id=?').bind(found.id).first<{total:number}>();
  return reply({sessionToken:token,mode:found.mode,date:found.quiz_date,questions:await publicQuestions(env.DB,found.id),
    nextPosition:(status?.answered??0)+1,score:status?.score??0,
    completed:!!found.completed_at || ((total?.total??0)>0 && status?.answered===total?.total)});
}
async function recordRating(db:D1Database,pepper:string,userId:string,questionId:string,correct:boolean):Promise<void>{
  const voter=await keyedVoter(userId,pepper);
  const attempt=await db.prepare(`INSERT OR IGNORE INTO question_rating_dedupe(question_id,voter_hash,expires_at)
    VALUES (?,?,datetime('now','+30 days'))`).bind(questionId,voter).run();
  if((attempt.meta.changes??0)===0)return;
  await db.prepare(`INSERT INTO question_stats(question_id,rated_attempts,correct_attempts,last_rated_at)
    VALUES (?,1,?,datetime('now'))
    ON CONFLICT(question_id) DO UPDATE SET rated_attempts=rated_attempts+1,
      correct_attempts=correct_attempts+excluded.correct_attempts,last_rated_at=datetime('now'),updated_at=datetime('now')`)
    .bind(questionId,correct?1:0).run();
}
async function answer(request:Request,env:QuizEnv,user:Player|null):Promise<Response>{
  const body=await requestJson(request);
  const session=await getSession(env.DB,body['sessionToken'],user);
  if(session.completed_at)throw new QuizError(409,'Partita già completata.');
  const position=body['position'];const option=body['optionIndex'];
  if(!Number.isInteger(position)||Number(position)<1||Number(position)>50||!Number.isInteger(option)||Number(option)<0||Number(option)>3)
    throw new QuizError(400,'Risposta non valida.');
  const next=await env.DB.prepare(`SELECT position,question_id FROM quiz_session_answers WHERE session_id=? AND selected_option_index IS NULL ORDER BY position LIMIT 1`)
    .bind(session.id).first<{position:number;question_id:string}>();
  if(!next||next.position!==position)throw new QuizError(409,'Rispondi alla domanda corrente, una sola volta.');
  const correct=await env.DB.prepare('SELECT option_index FROM question_options WHERE question_id=? AND is_correct=1')
    .bind(next.question_id).first<{option_index:number}>();
  const info=await env.DB.prepare('SELECT explanation FROM questions WHERE id=?').bind(next.question_id).first<{explanation:string}>();
  if(!correct||!info)throw new QuizError(503,'Domanda temporaneamente non disponibile.');
  const isCorrect=correct.option_index===option;
  const update=await env.DB.prepare(`UPDATE quiz_session_answers SET selected_option_index=?,is_correct=?,answered_at=datetime('now')
    WHERE session_id=? AND position=? AND selected_option_index IS NULL`).bind(option,isCorrect?1:0,session.id,position).run();
  if((update.meta.changes??0)!==1)throw new QuizError(409,'Hai già risposto a questa domanda.');
  if(user && env.RATING_PEPPER && env.RATING_PEPPER.length>=32){
    try{ await recordRating(env.DB,env.RATING_PEPPER,user.id,next.question_id,isCorrect); }
    catch(e){ console.error('Rating aggregation failed',e instanceof Error?e.name:'unknown'); }
  }
  const summary=await env.DB.prepare(`SELECT COUNT(*) AS total,COUNT(selected_option_index) AS answered,
    COALESCE(SUM(CASE WHEN is_correct=1 THEN 1 ELSE 0 END),0) AS score FROM quiz_session_answers WHERE session_id=?`)
    .bind(session.id).first<{total:number;answered:number;score:number}>();
  const completed=!!summary&&summary.answered===summary.total;
  if(completed && summary){
    await env.DB.prepare("UPDATE quiz_play_sessions SET completed_at=datetime('now') WHERE id=? AND completed_at IS NULL").bind(session.id).run();
    if(user){
      const date=romeDay();
      const slug=session.mode==='daily'?'daily':`free:${session.category_slug??'all'}:${session.requested_difficulty??'mixed'}:${summary.total}`;
      const seconds=Math.max(1,Math.round((Date.now()-Date.parse(session.started_at))/1000));
      await env.DB.prepare(`INSERT INTO quiz_results(user_id,quiz_date,quiz_slug,score,total,duration_seconds,completed_at)
        VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,quiz_date,quiz_slug) DO UPDATE SET
          score=MAX(score,excluded.score),total=excluded.total,
          duration_seconds=CASE WHEN excluded.score>score THEN excluded.duration_seconds ELSE duration_seconds END,
          completed_at=excluded.completed_at`)
        .bind(user.id,session.mode==='daily'?(session.quiz_date??date):date,slug,summary.score,summary.total,seconds,new Date().toISOString()).run();
    }
  }
  return reply({isCorrect,correctOptionIndex:correct.option_index,explanation:info.explanation,
    score:summary?.score??0,total:summary?.total??0,completed});
}

async function admin(request:Request,env:QuizEnv,user:Player|null,path:string):Promise<Response>{
  const emails=(env.ADMIN_EMAILS??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!user||!emails.includes(user.email.toLowerCase()))throw new QuizError(403,'Accesso riservato agli amministratori.');
  if(path==='/api/admin/questions' && request.method==='GET'){
    const url=new URL(request.url);const status=url.searchParams.get('status')??'review';
    if(!['draft','review','published','rejected'].includes(status))throw new QuizError(400,'Stato non valido.');
    const rows=await env.DB.prepare(`SELECT q.id,q.prompt,q.explanation,q.category_slug,q.editor_difficulty,q.effective_difficulty,
       q.status,q.source_url,q.source_id,q.verified_at,q.created_at,
       o.option_index,o.answer_text,o.is_correct
       FROM (SELECT * FROM questions WHERE status=? ORDER BY created_at DESC,id LIMIT 50) q
       LEFT JOIN question_options o ON o.question_id=q.id
       ORDER BY q.created_at DESC,q.id,o.option_index`).bind(status).all();
    const items:{[key:string]:unknown;options:{option_index:number;answer_text:string;is_correct:number}[]}[]=[];
    for(const row of rows.results??[]){
      if(items.at(-1)?.['id']!==row['id']){
        items.push({id:row['id'],prompt:row['prompt'],explanation:row['explanation'],category_slug:row['category_slug'],
          editor_difficulty:row['editor_difficulty'],effective_difficulty:row['effective_difficulty'],status:row['status'],
          source_url:row['source_url'],source_id:row['source_id'],verified_at:row['verified_at'],created_at:row['created_at'],options:[]});
      }
      if(row['option_index']!=null)items.at(-1)?.options.push({option_index:Number(row['option_index']),
        answer_text:String(row['answer_text']),is_correct:Number(row['is_correct'])});
    }
    return reply({items,filter:status});
  }
  const match=/^\/api\/admin\/questions\/([a-zA-Z0-9:_-]{2,100})\/(publish|reject)$/.exec(path);
  if(match && request.method==='POST'){
    const body=await requestJson(request);
    const [_,id,action]=match;
    if(action==='publish'){
      if(body['verified']!==true)throw new QuizError(400,'Conferma di aver verificato la fonte e la risposta.');
      const prepared=await env.DB.prepare(`SELECT q.language,q.explanation,q.source_url,
        COUNT(o.option_index) AS total,SUM(o.is_correct) AS correct
        FROM questions q LEFT JOIN question_options o ON q.id=o.question_id
        WHERE q.id=? AND q.status IN ('draft','review') GROUP BY q.id`).bind(id).first<{
          language:string; explanation:string|null; source_url:string; total:number; correct:number;
        }>();
      if(!prepared)throw new QuizError(404,'Domanda non trovata o già revisionata.');
      if(prepared.language!=='it'||!prepared.explanation||prepared.explanation.trim().length<12||
          prepared.total!==4||prepared.correct!==1||!/^https:\/\//.test(prepared.source_url))
        throw new QuizError(409,'Non pubblicabile: servono quattro risposte, una corretta, spiegazione in italiano e fonte HTTPS.');
      await env.DB.prepare(`UPDATE questions SET status='published',verified_at=?,published_at=COALESCE(published_at,?),
        updated_at=datetime('now') WHERE id=? AND status IN ('draft','review')`)
        .bind(new Date().toISOString(),new Date().toISOString(),id).run();
    }else{
      await env.DB.prepare("UPDATE questions SET status='rejected',updated_at=datetime('now') WHERE id=? AND status IN ('draft','review')")
        .bind(id).run();
    }
    return reply({ok:true});
  }
  throw new QuizError(404,'Endpoint amministrativo non trovato.');
}

export async function quizApi(request:Request,env:QuizEnv,user:Player|null):Promise<Response>{
  const path=new URL(request.url).pathname;
  if(path.startsWith('/api/admin/'))return admin(request,env,user,path);
  if(path==='/api/quiz/catalog'&&request.method==='GET'){
    const items=await env.DB.prepare(`SELECT c.slug,c.label,COUNT(q.id) AS total FROM question_categories c
      LEFT JOIN questions q ON q.category_slug=c.slug AND q.status='published' AND q.language='it'
      WHERE c.enabled=1 GROUP BY c.slug,c.label,c.sort_order ORDER BY c.sort_order`).all();
    const tiers=await env.DB.prepare("SELECT effective_difficulty AS tier,COUNT(*) AS total FROM questions WHERE status='published' AND language='it' GROUP BY effective_difficulty").all();
    return reply({categories:items.results??[],difficulties:tiers.results??[],today:romeDay()});
  }
  if(path==='/api/quiz/start'&&request.method==='POST')return start(request,env,user);
  if(path==='/api/quiz/resume'&&request.method==='POST')return resume(request,env,user);
  if(path==='/api/quiz/answer'&&request.method==='POST')return answer(request,env,user);
  throw new QuizError(404,'Endpoint quiz non trovato.');
}
