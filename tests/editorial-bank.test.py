#!/usr/bin/env python3
"""Exercise the full D1 schema and 60-question draft import without remote writes."""
import json
import sqlite3
import subprocess
import tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bank=json.loads((ROOT/'seeds/editorial-20261113.json').read_text())
assert len(bank['questions'])==60
with tempfile.TemporaryDirectory(prefix='quizario-editorial-') as tmp:
    out=Path(tmp)/'drafts.sql'
    subprocess.run(['node',str(ROOT/'scripts/prepare-editorial-drafts.mjs'),f'--output={out}'],
                   cwd=ROOT,check=True)
    sql=out.read_text()
    assert "UPDATE questions SET status='published'" not in sql
    assert 'qa-fixture' not in sql
    db=sqlite3.connect(':memory:')
    db.execute('PRAGMA foreign_keys=ON')
    for migration in ['0001_core.sql','0002_question_bank.sql','0003_quiz_play.sql']:
        db.executescript((ROOT/'migrations'/migration).read_text())
    db.executescript(sql)
    def status():
        return dict(db.execute("""SELECT category_slug || ':' || effective_difficulty,COUNT(*)
            FROM questions WHERE import_batch_id='editorial_20261113_60'
            GROUP BY category_slug,effective_difficulty"""))
    expected={f'{c}:{d}':5 for c in ['storia','sport','cinema','cultura']
              for d in ['easy','medium','hard']}
    assert status()==expected,status()
    assert db.execute("""SELECT COUNT(*) FROM questions
        WHERE import_batch_id='editorial_20261113_60' AND status='draft' AND verified_at IS NULL""").fetchone()[0]==60
    assert db.execute("""SELECT COUNT(*) FROM (
        SELECT question_id FROM question_options WHERE question_id LIKE 'draft_20261113_%'
        GROUP BY question_id HAVING COUNT(*)=4 AND SUM(is_correct)=1)""").fetchone()[0]==60
    db.executescript(sql)
    assert status()==expected,'Duplicate import'
    # Editorial correction must not be clobbered or re-imported.
    ident='draft_20261113_e01'
    db.execute("UPDATE questions SET prompt='Domanda corretta manualmente: in che anno?',revision=revision+1 WHERE id=?",(ident,))
    db.executescript(sql)
    assert db.execute("SELECT prompt FROM questions WHERE id=?",(ident,)).fetchone()[0]=='Domanda corretta manualmente: in che anno?'
    assert status()==expected
    # Rejected drafts stay rejected after re-import.
    db.execute("UPDATE questions SET status='rejected' WHERE id=?",(ident,))
    db.executescript(sql)
    assert db.execute("SELECT status FROM questions WHERE id=?",(ident,)).fetchone()[0]=='rejected'
    assert db.execute("SELECT COUNT(*) FROM questions WHERE import_batch_id='editorial_20261113_60'").fetchone()[0]==60
    # Import must never mark a question as source-verified.
    assert db.execute("SELECT COUNT(*) FROM questions WHERE import_batch_id='editorial_20261113_60' AND verified_at IS NOT NULL").fetchone()[0]==0
    print('OK: 60 draft-only questions, 4 categories x 3 tiers x 5; idempotent, review required')
