-- User data is intentionally minimal. Store summaries, not per-answer histories.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

-- Reserved for future server-validated quiz completions. Not used by demo UI.
CREATE TABLE IF NOT EXISTS quiz_results (
  user_id TEXT NOT NULL,
  quiz_date TEXT NOT NULL,
  quiz_slug TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total INTEGER NOT NULL CHECK (total > 0),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds >= 0),
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, quiz_date, quiz_slug),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quiz_results_date ON quiz_results(quiz_date, quiz_slug, score DESC);
