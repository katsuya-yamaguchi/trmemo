-- ロールバック用マイグレーション（緊急時のみ使用）
-- 注意: このマイグレーションは通常実行しません

-- トリガーを削除
DROP TRIGGER IF EXISTS update_body_stats_updated_at ON body_stats;

-- インデックスを削除
DROP INDEX IF EXISTS idx_body_stats_updated_at;

-- カラムを削除
ALTER TABLE body_stats DROP COLUMN IF EXISTS updated_at;

-- 注意: このマイグレーションを実行すると、updated_atカラムとその中のデータが完全に失われます 