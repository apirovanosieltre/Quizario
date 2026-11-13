#!/usr/bin/env python3
"""Small persistent SQLite-D1 adapter used ONLY by the offline Node API integration test."""
import json
import sqlite3
import sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:',isolation_level=None)
db.row_factory=sqlite3.Row
db.execute('PRAGMA foreign_keys=ON')
for name in ('0001_core.sql','0002_question_bank.sql','0003_quiz_play.sql','0004_daily_leaderboard.sql'):
    db.executescript((root/'migrations'/name).read_text())
db.executescript((root/'imports/qa-only-local.sql').read_text())

def run(op):
    if op.get('type')=='batch':
        db.execute('BEGIN')
        try:
            rows=[run(x) for x in op['ops']]
            db.execute('COMMIT')
            return rows
        except Exception:
            db.execute('ROLLBACK')
            raise
    before=db.total_changes
    cursor=db.execute(op['sql'],op.get('params',[]))
    return {'results':[dict(x) for x in cursor.fetchall()],'meta':{'changes':db.total_changes-before}}

for line in sys.stdin:
    try:
        result=run(json.loads(line))
        print(json.dumps({'ok':True,'result':result}),flush=True)
    except Exception as e:
        print(json.dumps({'ok':False,'error':str(e)}),flush=True)
