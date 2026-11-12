-- Recupero idempotente per Quizario D1; non modifica righe esistenti.
CREATE TRIGGER IF NOT EXISTS trg_question_options_no_update_published
BEFORE UPDATE ON question_options
WHEN (SELECT status FROM questions WHERE id=OLD.question_id)='published'
  OR (SELECT status FROM questions WHERE id=NEW.question_id)='published'
BEGIN SELECT RAISE(ABORT,'Rimettere in revisione prima di modificare risposte'); END;