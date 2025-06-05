-- 既存テーブルにカラムを追加する方法の例
-- （この例では training_plans テーブルに体重関連カラムを追加）

-- 新しいカラムを追加
ALTER TABLE training_plans 
ADD COLUMN weight DECIMAL(5,2) CHECK (weight > 0 AND weight <= 999.99),
ADD COLUMN body_fat_percentage DECIMAL(4,2) CHECK (body_fat_percentage >= 0 AND body_fat_percentage <= 100),
ADD COLUMN stats_recorded_at DATE;

-- インデックスを追加
CREATE INDEX idx_training_plans_stats_recorded ON training_plans(stats_recorded_at);

-- 制約を追加（同じユーザーの同じ日の記録を防ぐ）
ALTER TABLE training_plans 
ADD CONSTRAINT unique_user_stats_date 
UNIQUE(user_id, stats_recorded_at);

-- 既存データのデフォルト値設定（必要に応じて）
-- UPDATE training_plans SET weight = 70.0 WHERE weight IS NULL;

-- コメント追加（ドキュメント化）
COMMENT ON COLUMN training_plans.weight IS '体重（kg）';
COMMENT ON COLUMN training_plans.body_fat_percentage IS '体脂肪率（%）';
COMMENT ON COLUMN training_plans.stats_recorded_at IS '体重記録日'; 