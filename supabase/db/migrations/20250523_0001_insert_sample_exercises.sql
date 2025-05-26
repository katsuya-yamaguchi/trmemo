-- exercises テーブルにサンプルデータを投入

INSERT INTO public.exercises (id, name, muscle_group, description, type, image_url, target_muscles, difficulty, equipment, created_at, updated_at) VALUES
(uuid_generate_v4(), 'ベンチプレス', '胸', '胸筋を鍛える基本的な種目です。バーベルを胸まで下ろし、力強く押し上げます。', 'barbell', 'https://example.com/bench-press.jpg', ARRAY['大胸筋', '三角筋前部', '上腕三頭筋'], 'intermediate', ARRAY['バーベル', 'ベンチ'], NOW(), NOW()),

(uuid_generate_v4(), 'スクワット', '脚', '下半身全体を鍛える王道の種目です。膝を曲げて腰を下ろし、立ち上がります。', 'barbell', 'https://example.com/squat.jpg', ARRAY['大腿四頭筋', '大臀筋', 'ハムストリング'], 'beginner', ARRAY['バーベル'], NOW(), NOW()),

(uuid_generate_v4(), 'デッドリフト', '背中', '背中と下半身を同時に鍛える複合種目です。床からバーベルを持ち上げます。', 'barbell', 'https://example.com/deadlift.jpg', ARRAY['広背筋', '僧帽筋', '大臀筋', 'ハムストリング'], 'advanced', ARRAY['バーベル'], NOW(), NOW()),

(uuid_generate_v4(), 'ダンベルカール', '腕', '上腕二頭筋を集中的に鍛える種目です。ダンベルを肘を固定して巻き上げます。', 'dumbbell', 'https://example.com/dumbbell-curl.jpg', ARRAY['上腕二頭筋'], 'beginner', ARRAY['ダンベル'], NOW(), NOW()),

(uuid_generate_v4(), 'ショルダープレス', '肩', '肩の筋肉を鍛える基本種目です。ダンベルを頭上に押し上げます。', 'dumbbell', 'https://example.com/shoulder-press.jpg', ARRAY['三角筋', '上腕三頭筋'], 'intermediate', ARRAY['ダンベル'], NOW(), NOW()),

(uuid_generate_v4(), 'プッシュアップ', '胸', '自重で行う胸筋トレーニングです。腕立て伏せとも呼ばれます。', 'other', 'https://example.com/push-up.jpg', ARRAY['大胸筋', '三角筋前部', '上腕三頭筋'], 'beginner', ARRAY[], NOW(), NOW()),

(uuid_generate_v4(), 'プルアップ', '背中', '自重で行う背中のトレーニングです。懸垂とも呼ばれます。', 'other', 'https://example.com/pull-up.jpg', ARRAY['広背筋', '上腕二頭筋'], 'intermediate', ARRAY['懸垂バー'], NOW(), NOW()),

(uuid_generate_v4(), 'レッグプレス', '脚', 'マシンを使って脚全体を鍛える種目です。座った状態で重量を押し上げます。', 'machine', 'https://example.com/leg-press.jpg', ARRAY['大腿四頭筋', '大臀筋'], 'beginner', ARRAY['レッグプレスマシン'], NOW(), NOW()),

(uuid_generate_v4(), 'ラットプルダウン', '背中', 'マシンを使って背中を鍛える種目です。上から重量を引き下ろします。', 'machine', 'https://example.com/lat-pulldown.jpg', ARRAY['広背筋', '上腕二頭筋'], 'beginner', ARRAY['ラットプルダウンマシン'], NOW(), NOW()),

(uuid_generate_v4(), 'バンドプル', '背中', 'レジスタンスバンドを使った背中のトレーニングです。', 'band', 'https://example.com/band-pull.jpg', ARRAY['広背筋', '僧帽筋'], 'beginner', ARRAY['レジスタンスバンド'], NOW(), NOW());

-- 投入したデータの確認用コメント
-- SELECT COUNT(*) FROM public.exercises; 