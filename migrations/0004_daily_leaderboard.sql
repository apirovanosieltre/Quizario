-- Quizario daily leaderboard: opt-in participation only.
-- Empty by default. Store no public-facing email/nickname or duplicate result rows.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS daily_leaderboard_opt_ins (
  user_id TEXT PRIMARY KEY NOT NULL,
  enabled_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
