#!/usr/bin/env python3
"""Offline integration tests for v0.2 migrations, import script and calibration SQL."""
import os
import sqlite3
import subprocess
import tempfile
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]

class QuestionBankTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.execute('PRAGMA foreign_keys = ON')
        for name in ('0001_core.sql', '0002_question_bank.sql'):
            self.db.executescript((ROOT/'migrations'/name).read_text())

    def tearDown(self):
        self.db.close()

    def generate_sql(self):
        with tempfile.TemporaryDirectory() as d:
            out=Path(d)/'questions.sql'
            run=subprocess.run(['node', 'scripts/import-open-questions.mjs',
              '--dataset=capitals', '--limit=7', '--fixture=examples/wikidata-capitals-fixture.json',
              f'--output={out}'], cwd=ROOT, capture_output=True, text=True)
            self.assertEqual(run.returncode,0, run.stderr)
            return out.read_text()

    def test_import_idempotent_and_four_answers(self):
        sql=self.generate_sql()
        self.db.executescript(sql)
        self.db.executescript(sql)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM questions').fetchone()[0],7)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM question_options').fetchone()[0],28)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM import_batches').fetchone()[0],1)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM questions WHERE status="draft" AND language="it"').fetchone()[0],7)
        for question_id, in self.db.execute('SELECT id FROM questions'):
            self.assertEqual(self.db.execute('SELECT SUM(is_correct) FROM question_options WHERE question_id=?',(question_id,)).fetchone()[0],1)

    def test_publish_gates_and_option_protection(self):
        self.db.executescript(self.generate_sql())
        question_id=self.db.execute('SELECT id FROM questions LIMIT 1').fetchone()[0]
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE questions SET status='published' WHERE id=?",(question_id,))
        self.db.execute("UPDATE questions SET verified_at=datetime('now') WHERE id=?",(question_id,))
        self.db.execute("UPDATE questions SET status='published' WHERE id=?",(question_id,))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute('DELETE FROM question_options WHERE question_id=? AND option_index=0',(question_id,))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("UPDATE questions SET prompt='Domanda modificata durante pubblicazione' WHERE id=?",(question_id,))

    def test_calibration_100_sample_threshold_and_cooldown(self):
        self.db.executescript(self.generate_sql())
        qid=self.db.execute("SELECT id FROM questions WHERE editor_difficulty='easy' LIMIT 1").fetchone()[0]
        self.db.execute("UPDATE questions SET verified_at=datetime('now'), status='published' WHERE id=?",(qid,))
        self.db.execute('INSERT INTO question_stats(question_id,rated_attempts,correct_attempts) VALUES(?,?,?)',(qid,99,2))
        self.db.executescript((ROOT/'scripts/recalibrate.sql').read_text())
        self.assertEqual(self.db.execute('SELECT effective_difficulty FROM questions WHERE id=?',(qid,)).fetchone()[0],'easy')
        self.db.execute('UPDATE question_stats SET rated_attempts=100 WHERE question_id=?',(qid,))
        self.db.executescript((ROOT/'scripts/recalibrate.sql').read_text())
        self.assertEqual(self.db.execute('SELECT effective_difficulty FROM questions WHERE id=?',(qid,)).fetchone()[0],'medium')
        self.assertIsNotNone(self.db.execute('SELECT calibrated_at FROM question_stats WHERE question_id=?',(qid,)).fetchone()[0])
        self.db.executescript((ROOT/'scripts/recalibrate.sql').read_text())
        self.assertEqual(self.db.execute('SELECT effective_difficulty FROM questions WHERE id=?',(qid,)).fetchone()[0],'medium')

    def test_scheduled_sql_mirrors_canonical_calibration(self):
        import re, json
        source=(ROOT/'scripts/recalibrate.sql').read_text()
        source='\n'.join(line for line in source.splitlines() if not line.strip().startswith('--'))
        statements=[s.strip() for s in source.split(';') if s.strip()]
        ts=(ROOT/'worker/maintenance.ts').read_text()
        matches=re.findall(r'const recalibrate[12] = ("(?:\\.|[^"\\])*");',ts)
        self.assertEqual([json.loads(s) for s in matches], statements)

    def test_daily_quiz_uniqueness_and_foreign_keys(self):
        self.db.executescript(self.generate_sql())
        qid=self.db.execute('SELECT id FROM questions LIMIT 1').fetchone()[0]
        self.db.execute("INSERT INTO daily_quiz_questions(quiz_date,position,question_id,tier_snapshot) VALUES('2026-11-12',1,?,'easy')",(qid,))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO daily_quiz_questions(quiz_date,position,question_id,tier_snapshot) VALUES('2026-11-12',2,?,'medium')",(qid,))

if __name__ == '__main__':
    unittest.main(verbosity=2)
