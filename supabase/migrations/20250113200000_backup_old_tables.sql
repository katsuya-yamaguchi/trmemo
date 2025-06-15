-- 古いトレーニングプラン関連テーブルのバックアップ
-- 作成日: 2025年1月13日
-- 目的: 新しいワークアウト構造への移行前のデータ保存

-- バックアップテーブル作成
CREATE TABLE IF NOT EXISTS backup_training_plans AS SELECT * FROM training_plans;
CREATE TABLE IF NOT EXISTS backup_user_training_plans AS SELECT * FROM user_training_plans;
CREATE TABLE IF NOT EXISTS backup_user_training_days AS SELECT * FROM user_training_days;
CREATE TABLE IF NOT EXISTS backup_user_day_exercises AS SELECT * FROM user_day_exercises; 