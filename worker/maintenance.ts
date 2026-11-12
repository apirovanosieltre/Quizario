/** Daily D1 maintenance. Mirrored from scripts/recalibrate.sql. */
export async function runMaintenance(db: D1Database): Promise<void> {
  const recalibrate1 = "UPDATE questions\nSET effective_difficulty = (\n  SELECT CASE\n   WHEN questions.effective_difficulty='easy' AND\n      (s.correct_attempts + 20.0 * CASE questions.editor_difficulty WHEN 'easy' THEN .85 WHEN 'medium' THEN .60 ELSE .30 END) / (s.rated_attempts + 20.0) < .75\n      THEN 'medium'\n   WHEN questions.effective_difficulty='medium' AND\n      (s.correct_attempts + 20.0 * CASE questions.editor_difficulty WHEN 'easy' THEN .85 WHEN 'medium' THEN .60 ELSE .30 END) / (s.rated_attempts + 20.0) > .85\n      THEN 'easy'\n   WHEN questions.effective_difficulty='medium' AND\n      (s.correct_attempts + 20.0 * CASE questions.editor_difficulty WHEN 'easy' THEN .85 WHEN 'medium' THEN .60 ELSE .30 END) / (s.rated_attempts + 20.0) < .40\n      THEN 'hard'\n   WHEN questions.effective_difficulty='hard' AND\n      (s.correct_attempts + 20.0 * CASE questions.editor_difficulty WHEN 'easy' THEN .85 WHEN 'medium' THEN .60 ELSE .30 END) / (s.rated_attempts + 20.0) > .50\n      THEN 'medium'\n   ELSE questions.effective_difficulty END\n  FROM question_stats s WHERE s.question_id=questions.id\n), updated_at=datetime('now')\nWHERE status='published' AND id IN (\n SELECT question_id FROM question_stats\n WHERE rated_attempts>=100 AND (calibrated_at IS NULL OR calibrated_at <= datetime('now','-7 days'))\n)";
  const recalibrate2 = "UPDATE question_stats SET calibrated_at=datetime('now')\nWHERE rated_attempts>=100 AND question_id IN (SELECT id FROM questions WHERE status='published')\n  AND (calibrated_at IS NULL OR calibrated_at <= datetime('now','-7 days'))";
  await db.batch([
    db.prepare(recalibrate1),
    db.prepare(recalibrate2),
    db.prepare("DELETE FROM quiz_play_sessions WHERE expires_at < strftime('%Y-%m-%dT%H:%M:%fZ','now')"),
    db.prepare("DELETE FROM question_rating_dedupe WHERE expires_at < datetime('now')"),
    db.prepare("DELETE FROM sessions WHERE expires_at < strftime('%Y-%m-%dT%H:%M:%fZ','now')"),
  ]);
}
