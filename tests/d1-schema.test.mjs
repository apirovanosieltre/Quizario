import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUIRED_TABLES, REQUIRED_INDEXES, REQUIRED_TRIGGERS,
  assessSchema, parseD1Rows,
} from '../scripts/verify-cloudflare-d1.mjs';

const all = [
  ...REQUIRED_TABLES.map(name => ({type:'table',name})),
  ...REQUIRED_INDEXES.map(name => ({type:'index',name})),
  ...REQUIRED_TRIGGERS.map(name => ({type:'trigger',name})),
];

test('schema completo verificato indipendentemente da tabelle interne', () => {
  const report = assessSchema([...all,{type:'table',name:'_cf_KV'}]);
  assert.equal(report.ok,true);
  assert.equal(report.hasMigrationLog,false);
});

test('se manca quiz_play_sessions la verifica blocca il deploy', () => {
  const report = assessSchema(all.filter(x=>x.name!=='quiz_play_sessions'));
  assert.equal(report.ok,false);
  assert.deepEqual(report.missingTables,['quiz_play_sessions']);
});

test('se manca un indice o trigger la verifica blocca il deploy', () => {
  const report = assessSchema(all.filter(x=>!['ux_one_daily_per_user_day','trg_question_publish_validate'].includes(x.name)));
  assert.deepEqual(report.missingIndexes,['ux_one_daily_per_user_day']);
  assert.deepEqual(report.missingTriggers,['trg_question_publish_validate']);
});

test('rileva d1_migrations senza richiedere la sua presenza', () => {
  const report = assessSchema([...all,{type:'table',name:'d1_migrations'}]);
  assert.equal(report.ok,true);
  assert.equal(report.hasMigrationLog,true);
});

test('interpreta correttamente la risposta API Cloudflare D1', () => {
  assert.deepEqual(parseD1Rows({success:true,result:[{success:true,results:all}]}),all);
  assert.throws(()=>parseD1Rows({success:false}),/risposta non valida/);
  assert.throws(()=>parseD1Rows({success:true,result:[{success:false}]}),/query dello schema/);
});