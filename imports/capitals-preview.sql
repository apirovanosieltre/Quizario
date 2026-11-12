-- Quizario question imports: all records DRAFT. Review and translate before publishing.
-- Idempotent: INSERT OR IGNORE. Existing editorial changes remain intact.
INSERT OR IGNORE INTO import_batches (id,source_id,recipe,status,attempted,completed_at) VALUES ('imp_capitals_e736cf32609ac297','wikidata','capitals','completed',7,datetime('now'));
INSERT OR IGNORE INTO questions (id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,import_batch_id,verified_at) VALUES ('q_2b3fdf5b208bbc6de5ed004e','2b3fdf5b208bbc6de5ed004e8b310cd2b9708e085ceb6f32c6ee4d8bd0bc3399','geografia','it','Paese: Francia. Qual è la capitale?','La capitale del Paese indicato è Parigi.','45350389','easy','easy','draft','wikidata','Q142','https://www.wikidata.org/wiki/Q142','imp_capitals_e736cf32609ac297',NULL);
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_2b3fdf5b208bbc6de5ed004e',0,'Pechino',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_2b3fdf5b208bbc6de5ed004e' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_2b3fdf5b208bbc6de5ed004e',1,'Berlino',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_2b3fdf5b208bbc6de5ed004e' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_2b3fdf5b208bbc6de5ed004e',2,'Parigi',1
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_2b3fdf5b208bbc6de5ed004e' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_2b3fdf5b208bbc6de5ed004e',3,'Ottawa',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_2b3fdf5b208bbc6de5ed004e' AND status='draft');
INSERT OR IGNORE INTO questions (id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,import_batch_id,verified_at) VALUES ('q_e1874681caf6226e39624f94','e1874681caf6226e39624f941479c94dcb627ddba4bbebb5e11ea1aca4bd385d','geografia','it','Paese: Regno Unito. Qual è la capitale?','La capitale del Paese indicato è Londra.','236483688','easy','easy','draft','wikidata','Q145','https://www.wikidata.org/wiki/Q145','imp_capitals_e736cf32609ac297',NULL);
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_e1874681caf6226e39624f94',0,'Parigi',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_e1874681caf6226e39624f94' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_e1874681caf6226e39624f94',1,'Tokyo',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_e1874681caf6226e39624f94' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_e1874681caf6226e39624f94',2,'Ottawa',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_e1874681caf6226e39624f94' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_e1874681caf6226e39624f94',3,'Londra',1
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_e1874681caf6226e39624f94' AND status='draft');
INSERT OR IGNORE INTO questions (id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,import_batch_id,verified_at) VALUES ('q_6583d39c1ea862702308f322','6583d39c1ea862702308f322cf669c6c9c1a5bf205578d98237b4e7366f2e1ff','geografia','it','Paese: Cina. Qual è la capitale?','La capitale del Paese indicato è Pechino.','106446137','easy','easy','draft','wikidata','Q148','https://www.wikidata.org/wiki/Q148','imp_capitals_e736cf32609ac297',NULL);
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_6583d39c1ea862702308f322',0,'Ottawa',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_6583d39c1ea862702308f322' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_6583d39c1ea862702308f322',1,'Pechino',1
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_6583d39c1ea862702308f322' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_6583d39c1ea862702308f322',2,'Parigi',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_6583d39c1ea862702308f322' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_6583d39c1ea862702308f322',3,'Berlino',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_6583d39c1ea862702308f322' AND status='draft');
INSERT OR IGNORE INTO questions (id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,import_batch_id,verified_at) VALUES ('q_9e3c184adf5c905e809885bf','9e3c184adf5c905e809885bf534441ecfb99bdcb3e595b6a9ae9d36e6014efd1','geografia','it','Paese: Canada. Qual è la capitale?','La capitale del Paese indicato è Ottawa.','165921156','easy','easy','draft','wikidata','Q16','https://www.wikidata.org/wiki/Q16','imp_capitals_e736cf32609ac297',NULL);
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_9e3c184adf5c905e809885bf',0,'Ottawa',1
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_9e3c184adf5c905e809885bf' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_9e3c184adf5c905e809885bf',1,'Tokyo',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_9e3c184adf5c905e809885bf' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_9e3c184adf5c905e809885bf',2,'Amsterdam',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_9e3c184adf5c905e809885bf' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_9e3c184adf5c905e809885bf',3,'Roma',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_9e3c184adf5c905e809885bf' AND status='draft');
INSERT OR IGNORE INTO questions (id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,import_batch_id,verified_at) VALUES ('q_a0b891a396633d34b63652c8','a0b891a396633d34b63652c8af5633e5d6410f6220b39fe0abee942504985a26','geografia','it','Paese: Giappone. Qual è la capitale?','La capitale del Paese indicato è Tokyo.','168528154','easy','easy','draft','wikidata','Q17','https://www.wikidata.org/wiki/Q17','imp_capitals_e736cf32609ac297',NULL);
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_a0b891a396633d34b63652c8',0,'Tokyo',1
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_a0b891a396633d34b63652c8' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_a0b891a396633d34b63652c8',1,'Amsterdam',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_a0b891a396633d34b63652c8' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_a0b891a396633d34b63652c8',2,'Ottawa',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_a0b891a396633d34b63652c8' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_a0b891a396633d34b63652c8',3,'Londra',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_a0b891a396633d34b63652c8' AND status='draft');
INSERT OR IGNORE INTO questions (id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,import_batch_id,verified_at) VALUES ('q_afbe9e7e122935ddb2ea2e7c','afbe9e7e122935ddb2ea2e7c930952bb26a33b6d5abeebbddbca8954b6165efc','geografia','it','Paese: Germania. Qual è la capitale?','La capitale del Paese indicato è Berlino.','184281575','easy','easy','draft','wikidata','Q183','https://www.wikidata.org/wiki/Q183','imp_capitals_e736cf32609ac297',NULL);
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_afbe9e7e122935ddb2ea2e7c',0,'Berlino',1
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_afbe9e7e122935ddb2ea2e7c' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_afbe9e7e122935ddb2ea2e7c',1,'Londra',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_afbe9e7e122935ddb2ea2e7c' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_afbe9e7e122935ddb2ea2e7c',2,'Roma',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_afbe9e7e122935ddb2ea2e7c' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_afbe9e7e122935ddb2ea2e7c',3,'Tokyo',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_afbe9e7e122935ddb2ea2e7c' AND status='draft');
INSERT OR IGNORE INTO questions (id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,import_batch_id,verified_at) VALUES ('q_ff582a911edb5a69f3b48314','ff582a911edb5a69f3b4831459a52247306f71d614093435ef64af84cad40c25','geografia','it','Paese: Spagna. Qual è la capitale?','La capitale del Paese indicato è Madrid.','267748009','easy','easy','draft','wikidata','Q29','https://www.wikidata.org/wiki/Q29','imp_capitals_e736cf32609ac297',NULL);
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_ff582a911edb5a69f3b48314',0,'Ottawa',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_ff582a911edb5a69f3b48314' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_ff582a911edb5a69f3b48314',1,'Madrid',1
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_ff582a911edb5a69f3b48314' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_ff582a911edb5a69f3b48314',2,'Londra',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_ff582a911edb5a69f3b48314' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
  SELECT 'q_ff582a911edb5a69f3b48314',3,'Parigi',0
  WHERE EXISTS (SELECT 1 FROM questions WHERE id='q_ff582a911edb5a69f3b48314' AND status='draft');
