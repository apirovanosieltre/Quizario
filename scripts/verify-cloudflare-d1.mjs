#!/usr/bin/env node
/**
 * Read-only preflight against the exact Cloudflare D1 configured in wrangler.jsonc.
 * No database writes, no migration bookkeeping, and no credentials in logs.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const REQUIRED_TABLES = [
  'users','sessions','quiz_results','question_categories','question_sources',
  'import_batches','questions','question_options','question_stats',
  'question_rating_dedupe','daily_quiz_questions','quiz_play_sessions',
  'quiz_session_answers','question_reports',
];
export const REQUIRED_INDEXES = [
  'idx_sessions_user','idx_sessions_expiry','idx_quiz_results_date',
  'idx_questions_selection','idx_questions_tier','idx_questions_review',
  'idx_questions_source','ux_question_one_correct','idx_rating_dedupe_expiry',
  'idx_daily_question','idx_play_sessions_expiry','idx_play_sessions_user',
  'idx_question_reports_pending','ux_one_daily_per_user_day',
];
export const REQUIRED_TRIGGERS = [
  'trg_question_publish_validate','trg_published_question_edit_lock',
  'trg_question_options_no_insert_published',
  'trg_question_options_no_update_published',
  'trg_question_options_no_delete_published',
];

export function assessSchema(rows) {
  if (!Array.isArray(rows)) throw Error('Risposta D1 senza elenco delle tabelle.');
  const found = new Set(rows.map(row => `${row.type}:${row.name}`));
  const missingTables = REQUIRED_TABLES.filter(name => !found.has(`table:${name}`));
  const missingIndexes = REQUIRED_INDEXES.filter(name => !found.has(`index:${name}`));
  const missingTriggers = REQUIRED_TRIGGERS.filter(name => !found.has(`trigger:${name}`));
  return {
    ok: missingTables.length === 0 && missingIndexes.length === 0 && missingTriggers.length === 0,
    missingTables, missingIndexes, missingTriggers,
    hasMigrationLog: found.has('table:d1_migrations'),
  };
}

export function parseD1Rows(body) {
  if (!body || body.success === false || !Array.isArray(body.result) || !body.result.length) {
    throw Error('Cloudflare D1 ha restituito una risposta non valida.');
  }
  const result = body.result[0];
  if (result.success === false || !Array.isArray(result.results)) {
    throw Error('La query dello schema D1 non è riuscita.');
  }
  return result.results;
}

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !account) {
    throw Error('Configura CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID (GitHub Actions secrets).');
  }
  if (!/^[0-9a-f]{32}$/i.test(account)) throw Error('CLOUDFLARE_ACCOUNT_ID non valido.');
  const configPath = resolve(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)));
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const db = config.d1_databases?.find(item => item.binding === 'DB');
  if (!db || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(db.database_id)) {
    throw Error('Binding DB o UUID database_id non valido in wrangler.jsonc.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${db.database_id}/query`, {
      method: 'POST',
      headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({sql:"SELECT type, name FROM sqlite_master WHERE type IN ('table','index','trigger')"}),
      signal: controller.signal,
    });
  } finally { clearTimeout(timeout); }
  if (!response.ok) {
    throw Error(`Cloudflare API HTTP ${response.status}: verifica token, permessi D1 Read e account/database ID.`);
  }
  const rows = parseD1Rows(await response.json());
  const state = assessSchema(rows);
  console.log(`D1 ${db.database_name}: ${REQUIRED_TABLES.length - state.missingTables.length}/${REQUIRED_TABLES.length} tabelle, ${REQUIRED_INDEXES.length - state.missingIndexes.length}/${REQUIRED_INDEXES.length} indici, ${REQUIRED_TRIGGERS.length - state.missingTriggers.length}/${REQUIRED_TRIGGERS.length} trigger.`);
  if (!state.hasMigrationLog) console.warn('ATTENZIONE: d1_migrations assente. Schema creato manualmente: allineare Wrangler solo dopo il controllo dei dati.');
  for (const [type, names] of Object.entries({tabelle:state.missingTables, indici:state.missingIndexes, trigger:state.missingTriggers})) {
    if (names.length) console.error(`Mancano ${type}: ${names.join(', ')}`);
  }
  if (!state.ok) throw Error('Schema D1 incompleto: import e deploy bloccati.');
  console.log('OK: schema D1 completo (controllo strutturale, senza modifiche).');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`Verifica D1 fallita: ${error.message}`); process.exitCode = 1; });
}