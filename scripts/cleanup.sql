-- Can be scheduled once a day. Keeps short-lived gameplay/dedupe records only.
-- Do not delete unanswered sessions before their 48h expiry.
DELETE FROM quiz_play_sessions WHERE expires_at < datetime('now');
DELETE FROM question_rating_dedupe WHERE expires_at < datetime('now');
DELETE FROM sessions WHERE expires_at < strftime('%Y-%m-%dT%H:%M:%fZ','now');
