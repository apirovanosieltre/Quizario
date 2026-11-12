-- Quizario v0.3: one authenticated daily attempt per local calendar date.
-- Keep the daily session row until expiry: no second ranked attempt after reloading.
CREATE UNIQUE INDEX IF NOT EXISTS ux_one_daily_per_user_day
 ON quiz_play_sessions(user_id,quiz_date) WHERE mode='daily' AND user_id IS NOT NULL;
