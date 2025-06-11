-- より安全な段階的アプローチ
-- Step 1: カラムを追加（NULL許可）
ALTER TABLE body_stats 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE;

-- Step 2: 既存データの更新
UPDATE body_stats 
SET updated_at = CASE 
    WHEN created_at IS NOT NULL THEN created_at
    ELSE TIMEZONE('utc', NOW())
END
WHERE updated_at IS NULL;

-- Step 3: デフォルト値を設定
ALTER TABLE body_stats 
ALTER COLUMN updated_at SET DEFAULT TIMEZONE('utc', NOW());

-- Step 4: NOT NULL制約を追加
ALTER TABLE body_stats 
ALTER COLUMN updated_at SET NOT NULL;

-- Step 5: トリガーを追加
DROP TRIGGER IF EXISTS update_body_stats_updated_at ON body_stats;
CREATE TRIGGER update_body_stats_updated_at
    BEFORE UPDATE ON body_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: 確認用インデックス（オプション）
CREATE INDEX IF NOT EXISTS idx_body_stats_updated_at ON body_stats(updated_at); 