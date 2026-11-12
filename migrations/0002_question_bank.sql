-- Quizario v0.2: question bank, audit provenance, two gameplay modes.
-- Apply AFTER 0001_core.sql. New questions are NEVER automatically published.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS question_categories (
  slug TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1))
);
INSERT OR IGNORE INTO question_categories(slug,label,sort_order) VALUES
 ('cultura','Cultura generale',10),('geografia','Geografia',20),
 ('storia','Storia',30),('scienza','Scienza',40),
 ('sport','Sport',50),('cinema','Cinema e TV',60);

CREATE TABLE IF NOT EXISTS question_sources (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  home_url TEXT NOT NULL,
  license_id TEXT NOT NULL,
  license_url TEXT NOT NULL,
  attribution_note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO question_sources(id,name,home_url,license_id,license_url,attribution_note) VALUES
 ('wikidata','Wikidata','https://www.wikidata.org/','CC0-1.0',
  'https://creativecommons.org/publicdomain/zero/1.0/',
  'Dati strutturati Wikidata (CC0). Domande e distrattori generati da Quizario.'),
 ('opentdb','Open Trivia Database','https://opentdb.com/','CC-BY-SA-4.0',
  'https://creativecommons.org/licenses/by-sa/4.0/',
  'Contenuti forniti da Open Trivia Database, CC BY-SA 4.0. Indicare le modifiche e applicare ShareAlike agli adattamenti.');

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY NOT NULL,
  source_id TEXT NOT NULL REFERENCES question_sources(id),
  recipe TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'prepared' CHECK(status IN ('prepared','completed','failed')),
  attempted INTEGER NOT NULL DEFAULT 0 CHECK(attempted>=0),
  prepared_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY NOT NULL,
  content_hash TEXT NOT NULL UNIQUE,
  category_slug TEXT NOT NULL REFERENCES question_categories(slug),
  language TEXT NOT NULL DEFAULT 'it' CHECK(length(language) BETWEEN 2 AND 8),
  prompt TEXT NOT NULL CHECK(length(trim(prompt)) BETWEEN 12 AND 500),
  explanation TEXT,
  selection_key INTEGER NOT NULL DEFAULT 0 CHECK(selection_key BETWEEN 0 AND 2147483647),
  editor_difficulty TEXT NOT NULL CHECK(editor_difficulty IN ('easy','medium','hard')),
  effective_difficulty TEXT NOT NULL CHECK(effective_difficulty IN ('easy','medium','hard')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','review','published','rejected','archived')),
  source_id TEXT NOT NULL REFERENCES question_sources(id),
  source_item_id TEXT,
  source_url TEXT NOT NULL,
  verified_at TEXT,
  import_batch_id TEXT REFERENCES import_batches(id),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_questions_selection ON questions(status,language,category_slug,effective_difficulty,selection_key,id);
CREATE INDEX IF NOT EXISTS idx_questions_tier ON questions(status,language,effective_difficulty,selection_key,id);
CREATE INDEX IF NOT EXISTS idx_questions_review ON questions(status,created_at);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source_id,source_item_id);

CREATE TABLE IF NOT EXISTS question_options (
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL CHECK(option_index BETWEEN 0 AND 3),
  answer_text TEXT NOT NULL COLLATE NOCASE CHECK(length(trim(answer_text)) BETWEEN 1 AND 200),
  is_correct INTEGER NOT NULL CHECK(is_correct IN (0,1)),
  PRIMARY KEY(question_id, option_index),
  UNIQUE(question_id, answer_text)
);
-- Database enforces *at most* one correct option; publish trigger enforces exactly one.
CREATE UNIQUE INDEX IF NOT EXISTS ux_question_one_correct
  ON question_options(question_id) WHERE is_correct=1;

CREATE TRIGGER IF NOT EXISTS trg_question_publish_validate
BEFORE UPDATE OF status ON questions
WHEN NEW.status='published' AND OLD.status!='published'
BEGIN
 SELECT CASE WHEN NEW.language!='it' THEN RAISE(ABORT,'Pubblicare solo domande in italiano') END;
 SELECT CASE WHEN NEW.explanation IS NULL OR length(trim(NEW.explanation)) < 12
   THEN RAISE(ABORT,'Spiegazione insufficiente') END;
 SELECT CASE WHEN NEW.verified_at IS NULL OR NEW.verified_at=''
   THEN RAISE(ABORT,'Fonte non verificata') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM question_options WHERE question_id=NEW.id)!=4
   THEN RAISE(ABORT,'Servono esattamente quattro risposte') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM question_options WHERE question_id=NEW.id AND is_correct=1)!=1
   THEN RAISE(ABORT,'Serve esattamente una risposta corretta') END;
END;

CREATE TRIGGER IF NOT EXISTS trg_published_question_edit_lock
BEFORE UPDATE OF category_slug,language,prompt,explanation,source_id,source_url,editor_difficulty,verified_at ON questions
WHEN OLD.status='published' AND NEW.status='published'
BEGIN SELECT RAISE(ABORT,'Rimettere in revisione prima di modificare la domanda'); END;

CREATE TRIGGER IF NOT EXISTS trg_question_options_no_insert_published
BEFORE INSERT ON question_options
WHEN (SELECT status FROM questions WHERE id=NEW.question_id)='published'
BEGIN SELECT RAISE(ABORT,'Rimettere in revisione prima di modificare risposte'); END;
CREATE TRIGGER IF NOT EXISTS trg_question_options_no_update_published
BEFORE UPDATE ON question_options
WHEN (SELECT status FROM questions WHERE id=OLD.question_id)='published'
  OR (SELECT status FROM questions WHERE id=NEW.question_id)='published'
BEGIN SELECT RAISE(ABORT,'Rimettere in revisione prima di modificare risposte'); END;
CREATE TRIGGER IF NOT EXISTS trg_question_options_no_delete_published
BEFORE DELETE ON question_options
WHEN (SELECT status FROM questions WHERE id=OLD.question_id)='published'
BEGIN SELECT RAISE(ABORT,'Rimettere in revisione prima di modificare risposte'); END;

CREATE TABLE IF NOT EXISTS question_stats (
  question_id TEXT PRIMARY KEY NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  rated_attempts INTEGER NOT NULL DEFAULT 0 CHECK(rated_attempts>=0),
  correct_attempts INTEGER NOT NULL DEFAULT 0 CHECK(correct_attempts>=0 AND correct_attempts<=rated_attempts),
  last_rated_at TEXT,
  calibrated_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Temporary pseudonymous dedupe, cleanup after TTL. Voter hash = HMAC on server, never email/IP.
CREATE TABLE IF NOT EXISTS question_rating_dedupe (
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL CHECK(length(voter_hash)=64),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(question_id,voter_hash)
);
CREATE INDEX IF NOT EXISTS idx_rating_dedupe_expiry ON question_rating_dedupe(expires_at);

-- Fixed snapshots. Each day is generated once, and never silently replaced.
CREATE TABLE IF NOT EXISTS daily_quiz_questions (
  quiz_date TEXT NOT NULL CHECK(length(quiz_date)=10),
  position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 10),
  question_id TEXT NOT NULL REFERENCES questions(id),
  tier_snapshot TEXT NOT NULL CHECK(tier_snapshot IN ('easy','medium','hard')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(quiz_date,position),
  UNIQUE(quiz_date,question_id)
);
CREATE INDEX IF NOT EXISTS idx_daily_question ON daily_quiz_questions(question_id);

-- Temporary server-side state, NOT a lifetime answer history.
CREATE TABLE IF NOT EXISTS quiz_play_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  guest_voter_hash TEXT,
  mode TEXT NOT NULL CHECK(mode IN ('free','daily')),
  quiz_date TEXT,
  category_slug TEXT REFERENCES question_categories(slug),
  requested_difficulty TEXT CHECK(requested_difficulty IN ('easy','medium','hard','mixed')),
  session_token_hash TEXT NOT NULL UNIQUE,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_play_sessions_expiry ON quiz_play_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_play_sessions_user ON quiz_play_sessions(user_id);

CREATE TABLE IF NOT EXISTS quiz_session_answers (
  session_id TEXT NOT NULL REFERENCES quiz_play_sessions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK(position BETWEEN 1 AND 50),
  question_id TEXT NOT NULL REFERENCES questions(id),
  selected_option_index INTEGER CHECK(selected_option_index BETWEEN 0 AND 3),
  is_correct INTEGER CHECK(is_correct IN (0,1)),
  answered_at TEXT,
  PRIMARY KEY(session_id,position),
  UNIQUE(session_id,question_id)
);

CREATE TABLE IF NOT EXISTS question_reports (
  id TEXT PRIMARY KEY NOT NULL,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK(length(trim(reason)) BETWEEN 5 AND 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','dismissed')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_question_reports_pending ON question_reports(status,created_at);
