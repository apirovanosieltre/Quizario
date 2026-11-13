#!/usr/bin/env python3
"""SQLite regression for opt-in leaderboard migration. No remote D1 writes."""
import sqlite3
from pathlib import Path

root=Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
for name in ('0001_core.sql','0004_daily_leaderboard.sql','0004_daily_leaderboard.sql'):
    db.executescript((root/'migrations'/name).read_text())
db.execute("""INSERT INTO users(id,nickname,email,password_hash,password_salt,password_iterations,created_at,updated_at)
  VALUES ('player','Nickname','player@example.test','hash','salt',210000,datetime('now'),datetime('now'))""")
assert db.execute('SELECT COUNT(*) FROM daily_leaderboard_opt_ins').fetchone()[0]==0
db.execute("INSERT OR IGNORE INTO daily_leaderboard_opt_ins(user_id) VALUES ('player')")
db.execute("INSERT OR IGNORE INTO daily_leaderboard_opt_ins(user_id) VALUES ('player')")
assert db.execute('SELECT COUNT(*) FROM daily_leaderboard_opt_ins').fetchone()[0]==1
db.execute("DELETE FROM daily_leaderboard_opt_ins WHERE user_id='player'")
assert db.execute('SELECT COUNT(*) FROM daily_leaderboard_opt_ins').fetchone()[0]==0
db.execute("INSERT INTO daily_leaderboard_opt_ins(user_id) VALUES ('player')")
db.execute("DELETE FROM users WHERE id='player'")
assert db.execute('SELECT COUNT(*) FROM daily_leaderboard_opt_ins').fetchone()[0]==0
try:
    db.execute("INSERT INTO daily_leaderboard_opt_ins(user_id) VALUES ('unknown')")
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError('Expected FK to prevent consent for nonexisting account')
print('PASS: leaderboard schema idempotent, default-off, opt-out deletion, account cascade')
