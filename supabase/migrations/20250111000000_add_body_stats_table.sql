-- 体重・体脂肪率記録テーブルを新規作成
CREATE TABLE body_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight <= 999.99),
    body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
    recorded_at DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- 1日1回の記録制限
    UNIQUE(user_id, recorded_at)
);

-- インデックス作成
CREATE INDEX idx_body_stats_user_id ON body_stats(user_id);
CREATE INDEX idx_body_stats_recorded_at ON body_stats(recorded_at);
CREATE INDEX idx_body_stats_user_recorded ON body_stats(user_id, recorded_at DESC);

-- RLS有効化
ALTER TABLE body_stats ENABLE ROW LEVEL SECURITY;

-- RLSポリシー作成
CREATE POLICY "Users can view their own body stats" ON body_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own body stats" ON body_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own body stats" ON body_stats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own body stats" ON body_stats
    FOR DELETE USING (auth.uid() = user_id);

-- 既存のupdated_atトリガー関数を使用
CREATE TRIGGER update_body_stats_updated_at
    BEFORE UPDATE ON body_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 