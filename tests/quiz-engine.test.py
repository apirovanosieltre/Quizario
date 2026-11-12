#!/usr/bin/env python3
"""Offline integration checks for server-side quiz schema and editorial fixture."""
import sqlite3
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class QuizEngineTests(unittest.TestCase):
    def setUp(self):
        self.db=sqlite3.connect(':memory:')
        self.db.execute('PRAGMA foreign_keys=ON')
        for f in ('0001_core.sql','0002_question_bank.sql','0003_quiz_play.sql'):
            self.db.executescript((ROOT/'migrations'/f).read_text())
        self.db.executescript((ROOT/'imports/qa-only-local.sql').read_text())

    def tearDown(self):self.db.close()

    def test_fixture_has_enough_published_items_for_daily_progression(self):
        tiers=dict(self.db.execute("SELECT effective_difficulty,COUNT(*) FROM questions WHERE status='published' GROUP BY 1"))
        self.assertGreaterEqual(tiers['easy'],3)
        self.assertGreaterEqual(tiers['medium'],4)
        self.assertGreaterEqual(tiers['hard'],3)
        self.assertEqual(sum(tiers.values()),32)

    def test_all_options_single_correct_answer(self):
        for qid, in self.db.execute('SELECT id FROM questions'):
            options=self.db.execute('SELECT answer_text,is_correct FROM question_options WHERE question_id=?',(qid,)).fetchall()
            self.assertEqual(len(options),4)
            self.assertEqual(sum(x[1] for x in options),1)
            self.assertEqual(len(set(x[0].casefold() for x in options)),4)

    def test_not_allowed_to_modify_published_question(self):
        qid=self.db.execute('SELECT id FROM questions LIMIT 1').fetchone()[0]
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute('UPDATE questions SET prompt=? WHERE id=?',('Modificata senza revisione',qid))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute('UPDATE question_options SET is_correct=0 WHERE question_id=? AND is_correct=1',(qid,))

    def test_daily_has_unique_question_and_position(self):
        ids=[r[0] for r in self.db.execute('SELECT id FROM questions ORDER BY selection_key LIMIT 10')]
        for i,qid in enumerate(ids):
            self.db.execute('INSERT INTO daily_quiz_questions(quiz_date,position,question_id,tier_snapshot) VALUES(?,?,?,?)',('2026-11-11',i+1,qid,'easy'))
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute('INSERT INTO daily_quiz_questions(quiz_date,position,question_id,tier_snapshot) VALUES(?,?,?,?)',('2026-11-11',11,ids[0],'hard'))

    def test_only_one_logged_daily_session_per_date(self):
        self.db.execute("INSERT INTO users(id,nickname,email,password_hash,password_salt,password_iterations,created_at,updated_at) VALUES('u1','Test','test@example.org','hash','salt',210000,'2026-11-11','2026-11-11')")
        params=('u1','daily','2026-11-11','a'*64,'2026-11-11T10:00:00Z','2026-11-12T00:00:00Z')
        self.db.execute("INSERT INTO quiz_play_sessions(id,user_id,mode,quiz_date,session_token_hash,started_at,expires_at) VALUES('one',?,?,?,?,?,?)",params)
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO quiz_play_sessions(id,user_id,mode,quiz_date,session_token_hash,started_at,expires_at) VALUES('two',?,?,?,?,?,?)",('u1','daily','2026-11-11','b'*64,'2026-11-11T10:00:00Z','2026-11-12T00:00:00Z'))
        self.db.execute("INSERT INTO quiz_play_sessions(id,user_id,mode,quiz_date,session_token_hash,started_at,expires_at) VALUES('three',?,?,?,?,?,?)",('u1','daily','2026-11-12','c'*64,'2026-11-12T10:00:00Z','2026-11-13T00:00:00Z'))

    def test_one_dedupe_per_question_and_voter(self):
        qid=self.db.execute('SELECT id FROM questions LIMIT 1').fetchone()[0]
        statement='INSERT OR IGNORE INTO question_rating_dedupe(question_id,voter_hash,expires_at) VALUES(?,?,datetime(\'now\',\'+30 days\'))'
        for i in range(2):self.db.execute(statement,(qid,'a'*64))
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM question_rating_dedupe').fetchone()[0],1)

if __name__=='__main__':unittest.main(verbosity=2)
