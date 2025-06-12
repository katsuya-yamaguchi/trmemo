-- マイグレーション結果の確認

-- 1. 新しいテーブルが作成されているか確認
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_workouts', 'user_workout_exercises')
ORDER BY table_name;

-- 2. user_workoutsテーブルの構造確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_workouts'
ORDER BY ordinal_position;

-- 3. user_workout_exercisesテーブルの構造確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_workout_exercises'
ORDER BY ordinal_position;

-- 4. インデックスの確認
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('user_workouts', 'user_workout_exercises')
ORDER BY tablename, indexname;

-- 5. RLSポリシーの確認
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('user_workouts', 'user_workout_exercises')
ORDER BY tablename, policyname;

-- 6. 移行結果サマリー（migration_summaryビューが作成されている場合）
SELECT * FROM migration_summary ORDER BY table_name;

-- 7. 実際のデータ数確認
SELECT 
  'user_workouts' as table_name,
  COUNT(*) as record_count
FROM user_workouts
UNION ALL
SELECT 
  'user_workout_exercises' as table_name,
  COUNT(*) as record_count
FROM user_workout_exercises
UNION ALL
SELECT 
  'old_user_training_days' as table_name,
  COUNT(*) as record_count
FROM user_training_days
UNION ALL
SELECT 
  'old_user_day_exercises' as table_name,
  COUNT(*) as record_count
FROM user_day_exercises;

-- 8. サンプルデータの確認（最新5件）
SELECT 
  id,
  user_id,
  title,
  estimated_duration,
  created_at
FROM user_workouts 
ORDER BY created_at DESC 
LIMIT 5; 