-- 完全なbody_statsテーブルセットアップ
-- テーブル作成、制約、インデックス、RLSをすべて含む
-- updated_atはバックエンドコード側で管理

-- Step 1: テーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS body_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight <= 999.99),
    body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    recorded_at DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Step 2: UNIQUE制約（既に存在する場合はスキップ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'body_stats' 
        AND constraint_name = 'unique_user_recorded_date'
    ) THEN
        ALTER TABLE body_stats 
        ADD CONSTRAINT unique_user_recorded_date 
        UNIQUE (user_id, recorded_at);
    END IF;
END
$$;

-- Step 3: インデックス作成
CREATE INDEX IF NOT EXISTS idx_body_stats_user_id ON body_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_body_stats_recorded_at ON body_stats(recorded_at);
CREATE INDEX IF NOT EXISTS idx_body_stats_user_recorded ON body_stats(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_body_stats_updated_at ON body_stats(updated_at);

-- Step 4: RLS有効化
ALTER TABLE body_stats ENABLE ROW LEVEL SECURITY;

-- Step 5: RLSポリシー（既に存在する場合はスキップ）
DO $$
BEGIN
    -- SELECT ポリシー
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'body_stats' AND policyname = 'Users can view their own body stats'
    ) THEN
        CREATE POLICY "Users can view their own body stats" ON body_stats
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- INSERT ポリシー
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'body_stats' AND policyname = 'Users can insert their own body stats'
    ) THEN
        CREATE POLICY "Users can insert their own body stats" ON body_stats
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- UPDATE ポリシー
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'body_stats' AND policyname = 'Users can update their own body stats'
    ) THEN
        CREATE POLICY "Users can update their own body stats" ON body_stats
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- DELETE ポリシー
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'body_stats' AND policyname = 'Users can delete their own body stats'
    ) THEN
        CREATE POLICY "Users can delete their own body stats" ON body_stats
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'body_statsテーブルのセットアップが完了しました（updated_atはバックエンドコード管理）';
END
$$; 