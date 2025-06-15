-- 古いトレーニングプラン関連テーブルの削除
-- 作成日: 2025年1月13日
-- 注意: バックアップテーブルが作成済みであることを確認してから実行

-- 外部キー制約を持つテーブルから順番に削除
DROP TABLE IF EXISTS user_day_exercises CASCADE;
DROP TABLE IF EXISTS user_training_days CASCADE;
DROP TABLE IF EXISTS user_training_plans CASCADE;
DROP TABLE IF EXISTS training_plans CASCADE;

-- 関連するシーケンスも削除
DROP SEQUENCE IF EXISTS training_plans_id_seq CASCADE;
DROP SEQUENCE IF EXISTS user_training_plans_base_plan_id_seq CASCADE;

-- 削除確認用コメント
-- 以下のテーブルが削除されました:
-- - training_plans
-- - user_training_plans  
-- - user_training_days
-- - user_day_exercises
-- 
-- バックアップテーブルは保持されています:
-- - backup_training_plans
-- - backup_user_training_plans
-- - backup_user_training_days
-- - backup_user_day_exercises 