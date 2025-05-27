-- 既存の種目データを更新（type、image_url、target_muscles、equipment、difficultyを適切に設定）

-- ベンチプレスを更新
UPDATE public.exercises 
SET 
    type = 'barbell',
    image_url = 'https://example.com/bench-press.jpg',
    target_muscles = ARRAY['大胸筋', '三角筋前部', '上腕三頭筋']::TEXT[],
    equipment = ARRAY['バーベル', 'ベンチ']::TEXT[],
    difficulty = 'intermediate',
    updated_at = NOW()
WHERE name = 'ベンチプレス';

-- スクワットを更新
UPDATE public.exercises 
SET 
    type = 'barbell',
    image_url = 'https://example.com/squat.jpg',
    target_muscles = ARRAY['大腿四頭筋', '大臀筋', 'ハムストリング']::TEXT[],
    equipment = ARRAY['バーベル']::TEXT[],
    difficulty = 'beginner',
    updated_at = NOW()
WHERE name = 'スクワット';

-- デッドリフトを更新
UPDATE public.exercises 
SET 
    type = 'barbell',
    image_url = 'https://example.com/deadlift.jpg',
    target_muscles = ARRAY['広背筋', '僧帽筋', '大臀筋', 'ハムストリング']::TEXT[],
    equipment = ARRAY['バーベル']::TEXT[],
    difficulty = 'advanced',
    updated_at = NOW()
WHERE name = 'デッドリフト';

-- 懸垂を更新
UPDATE public.exercises 
SET 
    type = 'other',
    image_url = 'https://example.com/pull-up.jpg',
    target_muscles = ARRAY['広背筋', '上腕二頭筋']::TEXT[],
    equipment = ARRAY['懸垂バー']::TEXT[],
    difficulty = 'intermediate',
    updated_at = NOW()
WHERE name = '懸垂';

-- ショルダープレスを更新
UPDATE public.exercises 
SET 
    type = 'dumbbell',
    image_url = 'https://example.com/shoulder-press.jpg',
    target_muscles = ARRAY['三角筋', '上腕三頭筋']::TEXT[],
    equipment = ARRAY['ダンベル']::TEXT[],
    difficulty = 'intermediate',
    updated_at = NOW()
WHERE name = 'ショルダープレス';

-- 不足している種目タイプのデータを追加

-- ダンベル種目を追加
INSERT INTO public.exercises (id, name, muscle_group, description, type, image_url, target_muscles, difficulty, equipment, created_at, updated_at) VALUES
(uuid_generate_v4(), 'ダンベルカール', '腕', '上腕二頭筋を集中的に鍛える種目です。ダンベルを肘を固定して巻き上げます。', 'dumbbell', 'https://example.com/dumbbell-curl.jpg', ARRAY['上腕二頭筋']::TEXT[], 'beginner', ARRAY['ダンベル']::TEXT[], NOW(), NOW()),

(uuid_generate_v4(), 'ダンベルフライ', '胸', '胸筋を広げるように鍛える種目です。ダンベルを弧を描くように動かします。', 'dumbbell', 'https://example.com/dumbbell-fly.jpg', ARRAY['大胸筋']::TEXT[], 'intermediate', ARRAY['ダンベル', 'ベンチ']::TEXT[], NOW(), NOW()),

(uuid_generate_v4(), 'ダンベルロウ', '背中', '背中の筋肉を鍛える種目です。ダンベルを体に引き寄せます。', 'dumbbell', 'https://example.com/dumbbell-row.jpg', ARRAY['広背筋', '僧帽筋']::TEXT[], 'beginner', ARRAY['ダンベル']::TEXT[], NOW(), NOW());

-- マシン種目を追加
INSERT INTO public.exercises (id, name, muscle_group, description, type, image_url, target_muscles, difficulty, equipment, created_at, updated_at) VALUES
(uuid_generate_v4(), 'レッグプレス', '脚', 'マシンを使って脚全体を鍛える種目です。座った状態で重量を押し上げます。', 'machine', 'https://example.com/leg-press.jpg', ARRAY['大腿四頭筋', '大臀筋']::TEXT[], 'beginner', ARRAY['レッグプレスマシン']::TEXT[], NOW(), NOW()),

(uuid_generate_v4(), 'ラットプルダウン', '背中', 'マシンを使って背中を鍛える種目です。上から重量を引き下ろします。', 'machine', 'https://example.com/lat-pulldown.jpg', ARRAY['広背筋', '上腕二頭筋']::TEXT[], 'beginner', ARRAY['ラットプルダウンマシン']::TEXT[], NOW(), NOW()),

(uuid_generate_v4(), 'チェストプレス', '胸', 'マシンを使って胸筋を鍛える種目です。座った状態で重量を押し出します。', 'machine', 'https://example.com/chest-press.jpg', ARRAY['大胸筋', '三角筋前部']::TEXT[], 'beginner', ARRAY['チェストプレスマシン']::TEXT[], NOW(), NOW());

-- バンド種目を追加
INSERT INTO public.exercises (id, name, muscle_group, description, type, image_url, target_muscles, difficulty, equipment, created_at, updated_at) VALUES
(uuid_generate_v4(), 'バンドプル', '背中', 'レジスタンスバンドを使った背中のトレーニングです。', 'band', 'https://example.com/band-pull.jpg', ARRAY['広背筋', '僧帽筋']::TEXT[], 'beginner', ARRAY['レジスタンスバンド']::TEXT[], NOW(), NOW()),

(uuid_generate_v4(), 'バンドスクワット', '脚', 'レジスタンスバンドを使ったスクワットです。負荷を調整できます。', 'band', 'https://example.com/band-squat.jpg', ARRAY['大腿四頭筋', '大臀筋']::TEXT[], 'beginner', ARRAY['レジスタンスバンド']::TEXT[], NOW(), NOW()),

(uuid_generate_v4(), 'バンドプレス', '胸', 'レジスタンスバンドを使った胸のトレーニングです。', 'band', 'https://example.com/band-press.jpg', ARRAY['大胸筋', '三角筋前部']::TEXT[], 'beginner', ARRAY['レジスタンスバンド']::TEXT[], NOW(), NOW());

-- その他の自重種目を追加
INSERT INTO public.exercises (id, name, muscle_group, description, type, image_url, target_muscles, difficulty, equipment, created_at, updated_at) VALUES
(uuid_generate_v4(), 'プッシュアップ', '胸', '自重で行う胸筋トレーニングです。腕立て伏せとも呼ばれます。', 'other', 'https://example.com/push-up.jpg', ARRAY['大胸筋', '三角筋前部', '上腕三頭筋']::TEXT[], 'beginner', ARRAY[]::TEXT[], NOW(), NOW()),

(uuid_generate_v4(), 'プランク', '腹筋', '体幹を鍛える基本的な種目です。うつ伏せの状態で体を一直線に保ちます。', 'other', 'https://example.com/plank.jpg', ARRAY['腹直筋', '腹横筋']::TEXT[], 'beginner', ARRAY[]::TEXT[], NOW(), NOW()),

(uuid_generate_v4(), 'バーピー', '全身', '全身を使った高強度の種目です。スクワット、プッシュアップ、ジャンプを組み合わせます。', 'other', 'https://example.com/burpee.jpg', ARRAY['大腿四頭筋', '大胸筋', '三角筋']::TEXT[], 'advanced', ARRAY[]::TEXT[], NOW(), NOW());

-- 投入・更新したデータの確認用コメント
-- SELECT name, type, target_muscles, equipment, difficulty FROM public.exercises ORDER BY type, name; 