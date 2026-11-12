-- Recupero idempotente per Quizario D1; non modifica righe esistenti.
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