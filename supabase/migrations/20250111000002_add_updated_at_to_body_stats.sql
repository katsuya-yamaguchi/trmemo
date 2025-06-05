-- 既存のbody_statsテーブルにupdated_atカラムを追加
-- 1. まずカラムを追加（DEFAULT値付きで）
-- カラムが既に存在する場合はスキップ
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'body_stats' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE body_stats 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
        
        -- 2. 既存データのupdated_atを適切な値に更新
        UPDATE body_stats 
        SET updated_at = created_at 
        WHERE updated_at IS NULL;
        
        -- 3. カラムをNOT NULLに変更
        ALTER TABLE body_stats 
        ALTER COLUMN updated_at SET NOT NULL;
    END IF;
END $$;

-- 4. トリガーが存在しない場合のみ作成
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_body_stats_updated_at'
    ) THEN
        CREATE TRIGGER update_body_stats_updated_at
            BEFORE UPDATE ON body_stats
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$; 