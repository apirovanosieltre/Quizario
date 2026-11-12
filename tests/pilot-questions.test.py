#!/usr/bin/env python3
"""Non-destructive SQLite end-to-end test for the one-off published pilot dataset."""
import json
from pathlib import Path
import sqlite3
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
QUESTIONS = json.loads((ROOT/'seeds/pilot-questions.json').read_text())['questions']
assert len(QUESTIONS)==30
with tempfile.TemporaryDirectory(prefix='quizario-pilot-') as tmp:
    output = Path(tmp)/'pilot.sql'
    subprocess.run(['node',str(ROOT/'scripts/prepare-pilot.mjs'),f'--output={output}'],check=True,cwd=ROOT)
    sql = output.read_text()
    assert 'qa-fixture' not in sql
    assert sql.count('UPDATE questions SET status=\'published\'') == 30
    db=sqlite3.connect(':memory:')
    db.execute('PRAGMA foreign_keys=ON')
    for file in ['0001_core.sql','0002_question_bank.sql','0003_quiz_play.sql']:
        db.executescript((ROOT/'migrations'/file).read_text())
    db.executescript(sql)
    def counts():
        return dict(db.execute('''SELECT category_slug||':'||effective_difficulty,COUNT(*)
          FROM questions WHERE status='published'
            AND import_batch_id IN ('pilot_20261112_geografia','pilot_20261112_scienza')
          GROUP BY category_slug,effective_difficulty'''))
    expected={f'{category}:{tier}':5 for category in ['geografia','scienza'] for tier in ['easy','medium','hard']}
    assert counts() == expected,counts()
    assert db.execute('''SELECT COUNT(*) FROM questions WHERE status='published'
      AND import_batch_id IN ('pilot_20261112_geografia','pilot_20261112_scienza')''').fetchone()[0]==30
    assert db.execute('''SELECT COUNT(*) FROM (
      SELECT question_id FROM question_options
      WHERE question_id LIKE 'pilot_20261112_%'
      GROUP BY question_id HAVING COUNT(*)=4 AND SUM(is_correct)=1)''').fetchone()[0]==30
    # A second run must not insert duplicates or alter published records.
    db.executescript(sql)
    assert counts()==expected
    # An editor can withdraw a question, and the seed must NEVER republish it.
    key='pilot_20261112_g01'
    db.execute("UPDATE questions SET status='draft',verified_at=NULL,revision=revision+1 WHERE id=?",(key,))
    db.executescript(sql)
    assert db.execute('SELECT status FROM questions WHERE id=?',(key,)).fetchone()[0]=='draft'
    assert db.execute("SELECT COUNT(*) FROM questions WHERE status='published' AND id LIKE 'pilot_20261112_%'").fetchone()[0]==29
    # Guard SQL trigger behavior, no direct status update if options are missing.
    db.execute("INSERT INTO questions (id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_url,verified_at) VALUES ('pilot_invalid','unique_test_hash','scienza','it','Domanda di controllo senza risposte?', 'Spiegazione di controllo abbastanza lunga.',20,'easy','easy','draft','quizario-iupac','https://iupac.org/what-we-do/periodic-table-of-elements/','2026-11-12')")
    try:
        db.execute("UPDATE questions SET status='published' WHERE id='pilot_invalid'")
    except sqlite3.IntegrityError:
        pass
    else:
        raise AssertionError('Publishing without 4 options must fail')
    print('OK: 30 original published questions, 5 per category/tier, no overwrites or silent re-publication')