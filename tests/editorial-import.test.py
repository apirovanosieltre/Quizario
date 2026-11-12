#!/usr/bin/env python3
"""Offline regression for importer idempotence and preservation of manual corrections."""
from pathlib import Path
import sqlite3
root = Path(__file__).resolve().parents[1]
connection = sqlite3.connect(':memory:')
connection.row_factory = sqlite3.Row
for migration in ('0001_core.sql','0002_question_bank.sql','0003_quiz_play.sql'):
    connection.executescript((root/'migrations'/migration).read_text(encoding='utf-8'))

sources = (root/'imports/ci-currencies.sql',root/'imports/ci-symbols.sql')
for source in sources:
    connection.executescript(source.read_text(encoding='utf-8'))
assert connection.execute('SELECT COUNT(*) FROM questions').fetchone()[0] == 10
assert connection.execute("SELECT COUNT(*) FROM questions WHERE status='draft'").fetchone()[0] == 10
row = connection.execute("SELECT id FROM questions WHERE category_slug='geografia' LIMIT 1").fetchone()
assert row
question_id = row['id']
connection.execute("UPDATE questions SET prompt=?, content_hash=?, revision=revision+1 WHERE id=?",
                   ('Quale valuta si usa in questo Paese?', 'manual-editorial-correction-test-hash', question_id))
connection.execute('UPDATE question_options SET answer_text=? WHERE question_id=? AND option_index=0',
                   ('Risposta corretta editorialmente', question_id))
for source in sources:
    connection.executescript(source.read_text(encoding='utf-8'))
assert connection.execute('SELECT COUNT(*) FROM questions').fetchone()[0] == 10
updated = connection.execute('SELECT prompt, revision FROM questions WHERE id=?',(question_id,)).fetchone()
assert updated['prompt'] == 'Quale valuta si usa in questo Paese?'
assert updated['revision'] == 2
assert connection.execute('SELECT answer_text FROM question_options WHERE question_id=? AND option_index=0',
                          (question_id,)).fetchone()[0] == 'Risposta corretta editorialmente'
print('OK: nuovi dataset importabili, bozze idempotenti, correzioni editoriali preservate')