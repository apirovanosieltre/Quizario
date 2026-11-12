"""Regression for the two missing D1 triggers, using in-memory SQLite."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parent.parent
migration_files = (
    'migrations/0001_core.sql',
    'migrations/0002_question_bank.sql',
    'migrations/0003_quiz_play.sql',
)
repair_files = (
    'repairs/d1/01_publish_validation.sql',
    'repairs/d1/02_options_update_lock.sql',
)

with sqlite3.connect(':memory:') as db:
    for path in migration_files:
        db.executescript((root / path).read_text(encoding='utf8'))
    db.execute('DROP TRIGGER trg_question_publish_validate')
    db.execute('DROP TRIGGER trg_question_options_no_update_published')
    for _ in range(2):
        for path in repair_files:
            db.executescript((root / path).read_text(encoding='utf8'))
    names = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='trigger'")}
    assert len(names) == 5, names
    assert 'trg_question_publish_validate' in names
    assert 'trg_question_options_no_update_published' in names

    db.execute("""INSERT INTO questions
    (id,content_hash,category_slug,language,prompt,explanation,
     editor_difficulty,effective_difficulty,status,source_id,source_url)
    VALUES ('q_qa','hash_qa','geografia','it','Quale e la capitale della Francia?',
     'La capitale della Francia e Parigi.','easy','easy','draft','wikidata',
     'https://www.wikidata.org/wiki/Q142')""")
    try:
        db.execute("UPDATE questions SET status='published' WHERE id='q_qa'")
    except sqlite3.IntegrityError:
        pass
    else:
        raise AssertionError('Domanda incompleta pubblicata senza errore')

    for idx, text, correct in [(0,'Parigi',1),(1,'Londra',0),(2,'Berlino',0),(3,'Roma',0)]:
        db.execute('INSERT INTO question_options(question_id,option_index,answer_text,is_correct) VALUES (?,?,?,?)',
                   ('q_qa',idx,text,correct))
    db.execute("UPDATE questions SET verified_at=datetime('now') WHERE id='q_qa'")
    db.execute("UPDATE questions SET status='published' WHERE id='q_qa'")
    try:
        db.execute("UPDATE question_options SET answer_text='Lione' WHERE question_id='q_qa' AND option_index=0")
    except sqlite3.IntegrityError:
        pass
    else:
        raise AssertionError('Risposta di una domanda pubblicata modificata')
    assert db.execute("SELECT answer_text FROM question_options WHERE question_id='q_qa' AND option_index=0").fetchone()[0] == 'Parigi'

print('OK: trigger restaurati, idempotenti e protezioni verificate')