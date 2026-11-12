-- DATASET ESCLUSIVAMENTE PER TEST LOCALI. NON IMPORTARE SU D1 REMOTO.
INSERT OR IGNORE INTO question_sources(id,name,home_url,license_id,license_url,attribution_note)
     VALUES('qa-fixture','Esempi originali per QA locale','https://www.wikidata.org/','INTERNAL-QA-ONLY','https://www.wikidata.org/','Non verificati, mai pubblicare questo seed in produzione.');
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_fae08c996f767c3b25c4dac9','fae08c996f767c3b25c4dac9243a598591a28cf4bd9cf8b75bf20b6054de673c','cultura','it','Quanti lati ha un esagono?','Il prefisso esa- indica sei.',263063753,'easy','easy','draft','qa-fixture','QA-1','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_fae08c996f767c3b25c4dac9',0,'5',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_fae08c996f767c3b25c4dac9' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_fae08c996f767c3b25c4dac9',1,'6',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_fae08c996f767c3b25c4dac9' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_fae08c996f767c3b25c4dac9',2,'7',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_fae08c996f767c3b25c4dac9' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_fae08c996f767c3b25c4dac9',3,'8',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_fae08c996f767c3b25c4dac9' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_fae08c996f767c3b25c4dac9' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_c3323162bccb78355bdddb0d','c3323162bccb78355bdddb0dc70cb23026484048b0f40a27b5e8ccd43b149fc3','cultura','it','Quale strumento misura la pressione atmosferica?','Il barometro misura la pressione dell’aria.',204677910,'medium','medium','draft','qa-fixture','QA-2','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_c3323162bccb78355bdddb0d',0,'Igrometro',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_c3323162bccb78355bdddb0d' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_c3323162bccb78355bdddb0d',1,'Barometro',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_c3323162bccb78355bdddb0d' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_c3323162bccb78355bdddb0d',2,'Sismografo',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_c3323162bccb78355bdddb0d' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_c3323162bccb78355bdddb0d',3,'Termometro',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_c3323162bccb78355bdddb0d' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_c3323162bccb78355bdddb0d' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_144ceae809dd28a5fd793a9a','144ceae809dd28a5fd793a9afd404346e515e44d8cdbc2c5607357ac5a1f00ca','cultura','it','Qual è l’elemento chimico indicato da Au?','Au deriva dal latino aurum.',21286574,'medium','medium','draft','qa-fixture','QA-3','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_144ceae809dd28a5fd793a9a',0,'Argento',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_144ceae809dd28a5fd793a9a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_144ceae809dd28a5fd793a9a',1,'Alluminio',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_144ceae809dd28a5fd793a9a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_144ceae809dd28a5fd793a9a',2,'Oro',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_144ceae809dd28a5fd793a9a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_144ceae809dd28a5fd793a9a',3,'Argon',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_144ceae809dd28a5fd793a9a' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_144ceae809dd28a5fd793a9a' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_a093a674fea663e2ac8670a4','a093a674fea663e2ac8670a4a7ea91e91fc9f77d56b2ad386f8f45bd95a28a3e','cultura','it','Quante corde ha normalmente un violino?','Il violino standard ha quattro corde.',168376935,'easy','easy','draft','qa-fixture','QA-4','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_a093a674fea663e2ac8670a4',0,'4',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_a093a674fea663e2ac8670a4' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_a093a674fea663e2ac8670a4',1,'5',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_a093a674fea663e2ac8670a4' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_a093a674fea663e2ac8670a4',2,'6',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_a093a674fea663e2ac8670a4' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_a093a674fea663e2ac8670a4',3,'8',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_a093a674fea663e2ac8670a4' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_a093a674fea663e2ac8670a4' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_8bd0395e773cc0e238912668','8bd0395e773cc0e2389126682770075da6ade2ce7a7711e81250e303dee03b82','cultura','it','Quale lingua è stata usata per scrivere l’Eneide?','Virgilio compose l’Eneide in latino.',146604949,'medium','medium','draft','qa-fixture','QA-5','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_8bd0395e773cc0e238912668',0,'Greco',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_8bd0395e773cc0e238912668' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_8bd0395e773cc0e238912668',1,'Latino',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_8bd0395e773cc0e238912668' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_8bd0395e773cc0e238912668',2,'Etrusco',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_8bd0395e773cc0e238912668' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_8bd0395e773cc0e238912668',3,'Italiano',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_8bd0395e773cc0e238912668' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_8bd0395e773cc0e238912668' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_e0c313ec8898a47c916edac7','e0c313ec8898a47c916edac7a67bbd27c30fbf2cb9606d52a40669ffc5b3dd4b','scienza','it','Qual è il simbolo chimico dell’ossigeno?','Il simbolo dell’ossigeno è O.',235680062,'easy','easy','draft','qa-fixture','QA-6','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_e0c313ec8898a47c916edac7',0,'O',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_e0c313ec8898a47c916edac7' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_e0c313ec8898a47c916edac7',1,'Ox',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_e0c313ec8898a47c916edac7' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_e0c313ec8898a47c916edac7',2,'Os',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_e0c313ec8898a47c916edac7' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_e0c313ec8898a47c916edac7',3,'Og',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_e0c313ec8898a47c916edac7' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_e0c313ec8898a47c916edac7' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_56b0a22bc1c7a0e7c405cfe1','56b0a22bc1c7a0e7c405cfe11cc4e190f1a1bab787284f3b9b685ac660d98085','scienza','it','Quale pianeta del Sistema Solare è il più grande?','Giove è il pianeta più grande del Sistema Solare.',90901026,'easy','easy','draft','qa-fixture','QA-7','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_56b0a22bc1c7a0e7c405cfe1',0,'Terra',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_56b0a22bc1c7a0e7c405cfe1' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_56b0a22bc1c7a0e7c405cfe1',1,'Marte',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_56b0a22bc1c7a0e7c405cfe1' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_56b0a22bc1c7a0e7c405cfe1',2,'Giove',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_56b0a22bc1c7a0e7c405cfe1' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_56b0a22bc1c7a0e7c405cfe1',3,'Saturno',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_56b0a22bc1c7a0e7c405cfe1' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_56b0a22bc1c7a0e7c405cfe1' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_4cf27fa8aca1d8da10587f81','4cf27fa8aca1d8da10587f81491b7873068e712c1fc3119d2496145f5835dd6c','scienza','it','Qual è l’unità di misura della corrente elettrica?','L’ampere misura l’intensità della corrente.',80685050,'medium','medium','draft','qa-fixture','QA-8','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_4cf27fa8aca1d8da10587f81',0,'Volt',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_4cf27fa8aca1d8da10587f81' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_4cf27fa8aca1d8da10587f81',1,'Ampere',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_4cf27fa8aca1d8da10587f81' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_4cf27fa8aca1d8da10587f81',2,'Watt',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_4cf27fa8aca1d8da10587f81' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_4cf27fa8aca1d8da10587f81',3,'Ohm',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_4cf27fa8aca1d8da10587f81' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_4cf27fa8aca1d8da10587f81' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_b9f50969e97d00a018117d4a','b9f50969e97d00a018117d4a65274d3b53d45c0551b80a45e24d431f841f58e3','scienza','it','Quale gas assorbono le piante durante la fotosintesi?','Le piante assorbono CO₂ durante la fotosintesi.',194990230,'easy','easy','draft','qa-fixture','QA-9','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_b9f50969e97d00a018117d4a',0,'Ossigeno',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_b9f50969e97d00a018117d4a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_b9f50969e97d00a018117d4a',1,'Azoto',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_b9f50969e97d00a018117d4a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_b9f50969e97d00a018117d4a',2,'Elio',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_b9f50969e97d00a018117d4a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_b9f50969e97d00a018117d4a',3,'Anidride carbonica',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_b9f50969e97d00a018117d4a' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_b9f50969e97d00a018117d4a' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_689ea528d8187b3f55bf0066','689ea528d8187b3f55bf006690992a1755ef54da9618cc62b0f3fb657cd49b89','scienza','it','Quante ossa ha in genere lo scheletro di un adulto?','Il numero comunemente riportato è 206.',109701714,'medium','medium','draft','qa-fixture','QA-10','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_689ea528d8187b3f55bf0066',0,'106',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_689ea528d8187b3f55bf0066' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_689ea528d8187b3f55bf0066',1,'206',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_689ea528d8187b3f55bf0066' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_689ea528d8187b3f55bf0066',2,'306',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_689ea528d8187b3f55bf0066' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_689ea528d8187b3f55bf0066',3,'406',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_689ea528d8187b3f55bf0066' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_689ea528d8187b3f55bf0066' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_c07f03b7c3308a119e1639a6','c07f03b7c3308a119e1639a69bd83daea78211b43cdeabb122ff8fe38a7538fb','storia','it','In quale anno cadde l’Impero romano d’Occidente?','Il 476 d.C. è la data convenzionale della caduta.',201846843,'medium','medium','draft','qa-fixture','QA-11','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_c07f03b7c3308a119e1639a6',0,'476',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_c07f03b7c3308a119e1639a6' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_c07f03b7c3308a119e1639a6',1,'800',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_c07f03b7c3308a119e1639a6' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_c07f03b7c3308a119e1639a6',2,'1492',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_c07f03b7c3308a119e1639a6' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_c07f03b7c3308a119e1639a6',3,'1453',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_c07f03b7c3308a119e1639a6' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_c07f03b7c3308a119e1639a6' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_6638b1f3b1c569d70fdd6a4a','6638b1f3b1c569d70fdd6a4a40d4a6bec63bc98684b129004f2e716d314cf54c','storia','it','Chi fu il primo imperatore romano?','Ottaviano Augusto divenne il primo imperatore.',107186975,'medium','medium','draft','qa-fixture','QA-12','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_6638b1f3b1c569d70fdd6a4a',0,'Nerone',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_6638b1f3b1c569d70fdd6a4a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_6638b1f3b1c569d70fdd6a4a',1,'Augusto',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_6638b1f3b1c569d70fdd6a4a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_6638b1f3b1c569d70fdd6a4a',2,'Cesare',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_6638b1f3b1c569d70fdd6a4a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_6638b1f3b1c569d70fdd6a4a',3,'Traiano',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_6638b1f3b1c569d70fdd6a4a' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_6638b1f3b1c569d70fdd6a4a' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_2a91a68c7e6914d35c7d9b15','2a91a68c7e6914d35c7d9b15e679a111ac346465eb6f04e4704a9f5a3aa1a005','storia','it','In quale anno iniziò la Rivoluzione francese?','La Rivoluzione francese iniziò nel 1789.',44636776,'easy','easy','draft','qa-fixture','QA-13','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_2a91a68c7e6914d35c7d9b15',0,'1789',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_2a91a68c7e6914d35c7d9b15' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_2a91a68c7e6914d35c7d9b15',1,'1815',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_2a91a68c7e6914d35c7d9b15' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_2a91a68c7e6914d35c7d9b15',2,'1848',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_2a91a68c7e6914d35c7d9b15' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_2a91a68c7e6914d35c7d9b15',3,'1914',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_2a91a68c7e6914d35c7d9b15' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_2a91a68c7e6914d35c7d9b15' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_03820410cc15ebd392b0ad8e','03820410cc15ebd392b0ad8e9557c308a82dbbba0ec456bd7738be47f6c66bee','storia','it','Quale città venne sepolta dall’eruzione del Vesuvio nel 79 d.C.?','Pompei fu sepolta dai materiali vulcanici.',3678273,'easy','easy','draft','qa-fixture','QA-14','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_03820410cc15ebd392b0ad8e',0,'Napoli',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_03820410cc15ebd392b0ad8e' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_03820410cc15ebd392b0ad8e',1,'Pompei',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_03820410cc15ebd392b0ad8e' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_03820410cc15ebd392b0ad8e',2,'Paestum',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_03820410cc15ebd392b0ad8e' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_03820410cc15ebd392b0ad8e',3,'Roma',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_03820410cc15ebd392b0ad8e' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_03820410cc15ebd392b0ad8e' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_91c2ee32abd9a42211e0e9a2','91c2ee32abd9a42211e0e9a2982f1446c60e2953040b1f003448ad3c1cb52d67','storia','it','In quale secolo visse Leonardo da Vinci?','Leonardo visse dal 1452 al 1519.',152841955,'medium','medium','draft','qa-fixture','QA-15','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_91c2ee32abd9a42211e0e9a2',0,'XIII e XIV',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_91c2ee32abd9a42211e0e9a2' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_91c2ee32abd9a42211e0e9a2',1,'XIV e XV',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_91c2ee32abd9a42211e0e9a2' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_91c2ee32abd9a42211e0e9a2',2,'XV e XVI',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_91c2ee32abd9a42211e0e9a2' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_91c2ee32abd9a42211e0e9a2',3,'XVII e XVIII',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_91c2ee32abd9a42211e0e9a2' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_91c2ee32abd9a42211e0e9a2' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_adb71637ad7a434032f49a2a','adb71637ad7a434032f49a2a5911bbf37dde5bdabb8e2aeb81012babd04c4f7c','geografia','it','Qual è la capitale del Portogallo?','La capitale del Portogallo è Lisbona.',182153571,'easy','easy','draft','qa-fixture','QA-16','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_adb71637ad7a434032f49a2a',0,'Porto',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_adb71637ad7a434032f49a2a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_adb71637ad7a434032f49a2a',1,'Braga',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_adb71637ad7a434032f49a2a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_adb71637ad7a434032f49a2a',2,'Lisbona',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_adb71637ad7a434032f49a2a' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_adb71637ad7a434032f49a2a',3,'Faro',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_adb71637ad7a434032f49a2a' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_adb71637ad7a434032f49a2a' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_670083ce0899f13dcf764f8e','670083ce0899f13dcf764f8e92e03b9087da1f851c24a92620c3f087a6179032','geografia','it','In quale continente si trova il Perù?','Il Perù si trova in America del Sud.',108005436,'easy','easy','draft','qa-fixture','QA-17','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_670083ce0899f13dcf764f8e',0,'Asia',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_670083ce0899f13dcf764f8e' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_670083ce0899f13dcf764f8e',1,'America del Sud',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_670083ce0899f13dcf764f8e' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_670083ce0899f13dcf764f8e',2,'Africa',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_670083ce0899f13dcf764f8e' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_670083ce0899f13dcf764f8e',3,'Europa',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_670083ce0899f13dcf764f8e' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_670083ce0899f13dcf764f8e' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_d32bed791904a4b4984777cd','d32bed791904a4b4984777cd0e546c6fe46f7f4ea4015daf572cfdcf4c0a2543','geografia','it','Quale mare bagna le coste delle Marche?','Le Marche si affacciano sul mare Adriatico.',221429463,'easy','easy','draft','qa-fixture','QA-18','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d32bed791904a4b4984777cd',0,'Tirreno',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d32bed791904a4b4984777cd' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d32bed791904a4b4984777cd',1,'Ligure',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d32bed791904a4b4984777cd' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d32bed791904a4b4984777cd',2,'Adriatico',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d32bed791904a4b4984777cd' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d32bed791904a4b4984777cd',3,'Ionio soltanto',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d32bed791904a4b4984777cd' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_d32bed791904a4b4984777cd' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_ae8ca7d1b30f422cbaf9d3ce','ae8ca7d1b30f422cbaf9d3ce7877129d53291cc97587b7ca8342eef45e2aebf4','geografia','it','Qual è il fiume che attraversa Parigi?','La Senna attraversa Parigi.',183028349,'easy','easy','draft','qa-fixture','QA-19','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_ae8ca7d1b30f422cbaf9d3ce',0,'Tamigi',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_ae8ca7d1b30f422cbaf9d3ce' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_ae8ca7d1b30f422cbaf9d3ce',1,'Senna',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_ae8ca7d1b30f422cbaf9d3ce' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_ae8ca7d1b30f422cbaf9d3ce',2,'Reno',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_ae8ca7d1b30f422cbaf9d3ce' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_ae8ca7d1b30f422cbaf9d3ce',3,'Po',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_ae8ca7d1b30f422cbaf9d3ce' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_ae8ca7d1b30f422cbaf9d3ce' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_4579a0e2482ecd9da68566a5','4579a0e2482ecd9da68566a58612c169a46e54b2599e615eaa9fb74c419504e0','geografia','it','Qual è la vetta più alta delle Alpi?','Il Monte Bianco è la vetta più alta della catena alpina.',72849934,'medium','medium','draft','qa-fixture','QA-20','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_4579a0e2482ecd9da68566a5',0,'Monte Rosa',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_4579a0e2482ecd9da68566a5' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_4579a0e2482ecd9da68566a5',1,'Cervino',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_4579a0e2482ecd9da68566a5' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_4579a0e2482ecd9da68566a5',2,'Monte Bianco',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_4579a0e2482ecd9da68566a5' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_4579a0e2482ecd9da68566a5',3,'Gran Paradiso',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_4579a0e2482ecd9da68566a5' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_4579a0e2482ecd9da68566a5' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_95f3356e3555a93faee62038','95f3356e3555a93faee620380028d9f13a3c25e1d6d7d6198e8e0e4d54622f12','scienza','it','Quale elemento chimico possiede il numero atomico 74?','Il tungsteno, chiamato anche wolframio, ha numero atomico 74.',157234006,'hard','hard','draft','qa-fixture','QA-21','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_95f3356e3555a93faee62038',0,'Molibdeno',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_95f3356e3555a93faee62038' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_95f3356e3555a93faee62038',1,'Tungsteno',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_95f3356e3555a93faee62038' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_95f3356e3555a93faee62038',2,'Tantalio',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_95f3356e3555a93faee62038' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_95f3356e3555a93faee62038',3,'Rutenio',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_95f3356e3555a93faee62038' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_95f3356e3555a93faee62038' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_ffe854cbbda7aa2a165d9977','ffe854cbbda7aa2a165d9977e12b64315dc253599f862da9290a0652416bae3e','scienza','it','Quale lettera rappresenta la costante di Planck nelle formule fisiche?','La costante di Planck è indicata con h e nel SI si misura in joule per secondo moltiplicato per secondo (J·s).',268338508,'hard','hard','draft','qa-fixture','QA-22','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_ffe854cbbda7aa2a165d9977',0,'G',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_ffe854cbbda7aa2a165d9977' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_ffe854cbbda7aa2a165d9977',1,'k',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_ffe854cbbda7aa2a165d9977' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_ffe854cbbda7aa2a165d9977',2,'h',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_ffe854cbbda7aa2a165d9977' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_ffe854cbbda7aa2a165d9977',3,'c',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_ffe854cbbda7aa2a165d9977' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_ffe854cbbda7aa2a165d9977' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_0c5fe3d32380b5275bcb68cf','0c5fe3d32380b5275bcb68cf4ad1ad2e26961ccdcbbff375f164b36e2d459e2e','scienza','it','Qual è il numero atomico del titanio?','Il titanio, simbolo Ti, ha numero atomico 22.',12975677,'hard','hard','draft','qa-fixture','QA-23','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_0c5fe3d32380b5275bcb68cf',0,'22',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_0c5fe3d32380b5275bcb68cf' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_0c5fe3d32380b5275bcb68cf',1,'24',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_0c5fe3d32380b5275bcb68cf' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_0c5fe3d32380b5275bcb68cf',2,'26',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_0c5fe3d32380b5275bcb68cf' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_0c5fe3d32380b5275bcb68cf',3,'28',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_0c5fe3d32380b5275bcb68cf' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_0c5fe3d32380b5275bcb68cf' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_d2648cd25110c80adf1a89b0','d2648cd25110c80adf1a89b01ea42c78eee29da753be8d30556b11d3e7d08032','scienza','it','Quale particella determina l’identità di un elemento chimico?','Il numero di protoni nel nucleo determina il numero atomico e identifica l’elemento.',220612813,'hard','hard','draft','qa-fixture','QA-24','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d2648cd25110c80adf1a89b0',0,'Elettrone',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d2648cd25110c80adf1a89b0' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d2648cd25110c80adf1a89b0',1,'Neutrone',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d2648cd25110c80adf1a89b0' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d2648cd25110c80adf1a89b0',2,'Fotone',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d2648cd25110c80adf1a89b0' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d2648cd25110c80adf1a89b0',3,'Protone',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d2648cd25110c80adf1a89b0' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_d2648cd25110c80adf1a89b0' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_55820a80f1c2c1403b2fb823','55820a80f1c2c1403b2fb823493ecf4997d83d68168d03e30efc78a808a062cf','geografia','it','Qual è la capitale del Bhutan?','Thimphu è la capitale del Bhutan, un Paese dell’Asia meridionale.',89661608,'hard','hard','draft','qa-fixture','QA-25','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_55820a80f1c2c1403b2fb823',0,'Kathmandu',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_55820a80f1c2c1403b2fb823' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_55820a80f1c2c1403b2fb823',1,'Thimphu',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_55820a80f1c2c1403b2fb823' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_55820a80f1c2c1403b2fb823',2,'Vientiane',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_55820a80f1c2c1403b2fb823' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_55820a80f1c2c1403b2fb823',3,'Dacca',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_55820a80f1c2c1403b2fb823' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_55820a80f1c2c1403b2fb823' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_d35108d2ab0b64138124f54b','d35108d2ab0b64138124f54bc4949f0135a4c1575d84902fa716dd981ab7011a','geografia','it','Quale fiume è considerato il più lungo d’Europa?','Il Volga è considerato il fiume più lungo del continente europeo.',221581453,'hard','hard','draft','qa-fixture','QA-26','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d35108d2ab0b64138124f54b',0,'Danubio',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d35108d2ab0b64138124f54b' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d35108d2ab0b64138124f54b',1,'Reno',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d35108d2ab0b64138124f54b' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d35108d2ab0b64138124f54b',2,'Volga',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d35108d2ab0b64138124f54b' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d35108d2ab0b64138124f54b',3,'Dnepr',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d35108d2ab0b64138124f54b' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_d35108d2ab0b64138124f54b' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_8c5d202cbb56039d534b41ae','8c5d202cbb56039d534b41aef9c08d846ba226816fe7bba8bbea9c34c8aed066','geografia','it','In quale Paese si trova il lago Baikal?','Il lago Baikal si trova nella Siberia meridionale, in Russia.',147182082,'hard','hard','draft','qa-fixture','QA-27','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_8c5d202cbb56039d534b41ae',0,'Kazakhstan',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_8c5d202cbb56039d534b41ae' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_8c5d202cbb56039d534b41ae',1,'Russia',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_8c5d202cbb56039d534b41ae' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_8c5d202cbb56039d534b41ae',2,'Mongolia',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_8c5d202cbb56039d534b41ae' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_8c5d202cbb56039d534b41ae',3,'Cina',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_8c5d202cbb56039d534b41ae' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_8c5d202cbb56039d534b41ae' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_d5a5ee94d94addb5c3e13635','d5a5ee94d94addb5c3e13635e2eb2abfe1806365d4fe7c91073def0d339bdfc1','geografia','it','Qual è la capitale del Kirghizistan?','Bishkek è la capitale del Kirghizistan.',224026345,'hard','hard','draft','qa-fixture','QA-28','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d5a5ee94d94addb5c3e13635',0,'Bishkek',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d5a5ee94d94addb5c3e13635' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d5a5ee94d94addb5c3e13635',1,'Tashkent',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d5a5ee94d94addb5c3e13635' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d5a5ee94d94addb5c3e13635',2,'Astana',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d5a5ee94d94addb5c3e13635' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_d5a5ee94d94addb5c3e13635',3,'Dushanbe',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_d5a5ee94d94addb5c3e13635' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_d5a5ee94d94addb5c3e13635' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_801e46392cf2328c365d90da','801e46392cf2328c365d90da251296d410f604e42591d72d790033c6d80512c7','storia','it','In quale anno furono firmati i Trattati di Roma?','I Trattati di Roma furono firmati il 25 marzo 1957.',134341731,'hard','hard','draft','qa-fixture','QA-29','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_801e46392cf2328c365d90da',0,'1949',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_801e46392cf2328c365d90da' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_801e46392cf2328c365d90da',1,'1957',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_801e46392cf2328c365d90da' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_801e46392cf2328c365d90da',2,'1968',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_801e46392cf2328c365d90da' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_801e46392cf2328c365d90da',3,'1979',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_801e46392cf2328c365d90da' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_801e46392cf2328c365d90da' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_f886deb3165be27dee3ecbe9','f886deb3165be27dee3ecbe9188904b3d29e1cd1d8e6a812252e4c8dc5df9f90','storia','it','In quale anno venne promulgato il cosiddetto Editto di Milano?','L’accordo di Milano sulla tolleranza religiosa viene tradizionalmente datato al 313 d.C.',260599275,'hard','hard','draft','qa-fixture','QA-30','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_f886deb3165be27dee3ecbe9',0,'212',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_f886deb3165be27dee3ecbe9' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_f886deb3165be27dee3ecbe9',1,'313',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_f886deb3165be27dee3ecbe9' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_f886deb3165be27dee3ecbe9',2,'380',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_f886deb3165be27dee3ecbe9' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_f886deb3165be27dee3ecbe9',3,'476',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_f886deb3165be27dee3ecbe9' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_f886deb3165be27dee3ecbe9' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_e07d4945c92b4c095b59d42b','e07d4945c92b4c095b59d42bdf36962a019b69684db8d40ed1daf07c4188dd73','storia','it','In quale anno Galileo pubblicò il Dialogo sopra i due massimi sistemi del mondo?','Galileo pubblicò il Dialogo sopra i due massimi sistemi del mondo nel 1632.',235394196,'hard','hard','draft','qa-fixture','QA-31','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_e07d4945c92b4c095b59d42b',0,'1609',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_e07d4945c92b4c095b59d42b' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_e07d4945c92b4c095b59d42b',1,'1616',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_e07d4945c92b4c095b59d42b' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_e07d4945c92b4c095b59d42b',2,'1632',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_e07d4945c92b4c095b59d42b' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_e07d4945c92b4c095b59d42b',3,'1665',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_e07d4945c92b4c095b59d42b' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_e07d4945c92b4c095b59d42b' AND status='draft';
INSERT OR IGNORE INTO questions(id,content_hash,category_slug,language,prompt,explanation,selection_key,editor_difficulty,effective_difficulty,status,source_id,source_item_id,source_url,verified_at)
    VALUES ('qa_7282069952186f66f8c67983','7282069952186f66f8c679832b595e48c6211355251ebfcfad5ea9838871c835','cultura','it','Chi compose la Sinfonia n. 9 «Dal Nuovo Mondo»?','La Sinfonia Dal Nuovo Mondo è una composizione del musicista ceco Antonín Dvořák.',120070249,'hard','hard','draft','qa-fixture','QA-32','https://www.wikidata.org/','local QA record (not source-verified)');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_7282069952186f66f8c67983',0,'Antonín Dvořák',1 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_7282069952186f66f8c67983' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_7282069952186f66f8c67983',1,'Gustav Mahler',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_7282069952186f66f8c67983' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_7282069952186f66f8c67983',2,'Ludwig van Beethoven',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_7282069952186f66f8c67983' AND status='draft');
INSERT OR IGNORE INTO question_options(question_id,option_index,answer_text,is_correct)
    SELECT 'qa_7282069952186f66f8c67983',3,'Franz Schubert',0 WHERE EXISTS(SELECT 1 FROM questions WHERE id='qa_7282069952186f66f8c67983' AND status='draft');
UPDATE questions SET status='published',published_at=datetime('now') WHERE id='qa_7282069952186f66f8c67983' AND status='draft';
