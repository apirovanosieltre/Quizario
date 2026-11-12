-- Run daily/weekly via job or SQL console. No user-level answer history required.
-- Bayesian prior of 20 pseudo-votes based on editorial difficulty, followed by
-- minimum 100 rated attempts, 7-day cooldown and tier hysteresis.
-- Gates: easy -> medium below 0.75; medium -> easy above 0.85;
-- medium -> hard below 0.40; hard -> medium above 0.50.
UPDATE questions
SET effective_difficulty = (
  SELECT CASE
   WHEN questions.effective_difficulty='easy' AND
      (s.correct_attempts + 20.0 * CASE questions.editor_difficulty WHEN 'easy' THEN .85 WHEN 'medium' THEN .60 ELSE .30 END) / (s.rated_attempts + 20.0) < .75
      THEN 'medium'
   WHEN questions.effective_difficulty='medium' AND
      (s.correct_attempts + 20.0 * CASE questions.editor_difficulty WHEN 'easy' THEN .85 WHEN 'medium' THEN .60 ELSE .30 END) / (s.rated_attempts + 20.0) > .85
      THEN 'easy'
   WHEN questions.effective_difficulty='medium' AND
      (s.correct_attempts + 20.0 * CASE questions.editor_difficulty WHEN 'easy' THEN .85 WHEN 'medium' THEN .60 ELSE .30 END) / (s.rated_attempts + 20.0) < .40
      THEN 'hard'
   WHEN questions.effective_difficulty='hard' AND
      (s.correct_attempts + 20.0 * CASE questions.editor_difficulty WHEN 'easy' THEN .85 WHEN 'medium' THEN .60 ELSE .30 END) / (s.rated_attempts + 20.0) > .50
      THEN 'medium'
   ELSE questions.effective_difficulty END
  FROM question_stats s WHERE s.question_id=questions.id
), updated_at=datetime('now')
WHERE status='published' AND id IN (
 SELECT question_id FROM question_stats
 WHERE rated_attempts>=100 AND (calibrated_at IS NULL OR calibrated_at <= datetime('now','-7 days'))
);
-- Mark as calibrated even when the tier stays the same: prevents useless reruns.
UPDATE question_stats SET calibrated_at=datetime('now')
WHERE rated_attempts>=100 AND question_id IN (SELECT id FROM questions WHERE status='published')
  AND (calibrated_at IS NULL OR calibrated_at <= datetime('now','-7 days'));
