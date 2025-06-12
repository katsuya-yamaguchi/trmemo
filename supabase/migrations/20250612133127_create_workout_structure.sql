-- 新しいワークアウト構造の作成とデータ移行

-- Phase 1: 新しいテーブル作成

-- 1. user_workouts テーブル作成
CREATE TABLE user_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  estimated_duration INTEGER, -- 分単位
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. user_workout_exercises テーブル作成
CREATE TABLE user_workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_workout_id UUID NOT NULL REFERENCES user_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0, -- エクササイズの順序
  set_count INTEGER DEFAULT 3,
  rep_min INTEGER,
  rep_max INTEGER,
  reps VARCHAR DEFAULT '0', -- 既存の形式を維持
  default_weight VARCHAR,
  rest_seconds INTEGER DEFAULT 60, -- セット間の休憩時間
  notes TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. インデックス作成
CREATE INDEX idx_user_workouts_user_id ON user_workouts(user_id);
CREATE INDEX idx_user_workouts_created_at ON user_workouts(created_at);
CREATE INDEX idx_user_workout_exercises_workout_id ON user_workout_exercises(user_workout_id);
CREATE INDEX idx_user_workout_exercises_exercise_id ON user_workout_exercises(exercise_id);
CREATE INDEX idx_user_workout_exercises_order ON user_workout_exercises(user_workout_id, order_index);

-- 4. RLS有効化
ALTER TABLE user_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workout_exercises ENABLE ROW LEVEL SECURITY;

-- 5. user_workouts RLSポリシー
CREATE POLICY "Users can view own workouts" ON user_workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own workouts" ON user_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON user_workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workouts" ON user_workouts
  FOR DELETE USING (auth.uid() = user_id);

-- 6. user_workout_exercises RLSポリシー
CREATE POLICY "Users can view own workout exercises" ON user_workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_workouts 
      WHERE id = user_workout_exercises.user_workout_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own workout exercises" ON user_workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_workouts 
      WHERE id = user_workout_exercises.user_workout_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own workout exercises" ON user_workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_workouts 
      WHERE id = user_workout_exercises.user_workout_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own workout exercises" ON user_workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_workouts 
      WHERE id = user_workout_exercises.user_workout_id 
      AND user_id = auth.uid()
    )
  );

-- 7. updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_workouts_updated_at 
  BEFORE UPDATE ON user_workouts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_workout_exercises_updated_at 
  BEFORE UPDATE ON user_workout_exercises 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Phase 2: データ移行

-- 1. user_training_days → user_workouts への移行
INSERT INTO user_workouts (id, user_id, title, estimated_duration, created_at, updated_at)
SELECT 
  utd.id,
  utp.user_id,
  COALESCE(utd.title, 'ワークアウト ' || utd.day_number::text) as title,
  utd.estimated_duration,
  utd.created_at AT TIME ZONE 'UTC' as created_at,
  utd.updated_at as updated_at
FROM user_training_days utd
JOIN user_training_plans utp ON utd.user_training_plan_id = utp.id
WHERE utp.user_id IS NOT NULL
  AND utd.id IS NOT NULL;

-- 2. user_day_exercises → user_workout_exercises への移行
INSERT INTO user_workout_exercises (
  id, 
  user_workout_id, 
  exercise_id, 
  order_index,
  set_count, 
  rep_min, 
  rep_max, 
  reps, 
  default_weight, 
  rest_seconds,
  created_at, 
  updated_at
)
SELECT 
  ude.id,
  ude.user_training_day_id as user_workout_id,
  ude.exercise_id,
  ROW_NUMBER() OVER (PARTITION BY ude.user_training_day_id ORDER BY ude.created_at) - 1 as order_index,
  COALESCE(ude.set_count, 3) as set_count,
  ude.rep_min,
  ude.rep_max,
  COALESCE(ude.reps, '0') as reps,
  ude.default_weight,
  60 as rest_seconds, -- デフォルト値
  ude.created_at,
  ude.updated_at
FROM user_day_exercises ude
WHERE ude.user_training_day_id IN (
  SELECT id FROM user_workouts
)
  AND ude.exercise_id IS NOT NULL;

-- 3. 移行結果の確認用ビュー作成（一時的）
CREATE OR REPLACE VIEW migration_summary AS
SELECT 
  'user_workouts' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT user_id) as unique_users
FROM user_workouts
UNION ALL
SELECT 
  'user_workout_exercises' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT user_workout_id) as unique_workouts
FROM user_workout_exercises
UNION ALL
SELECT 
  'old_user_training_days' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT utp.user_id) as unique_users
FROM user_training_days utd
JOIN user_training_plans utp ON utd.user_training_plan_id = utp.id
WHERE utp.user_id IS NOT NULL
UNION ALL
SELECT 
  'old_user_day_exercises' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT user_training_day_id) as unique_days
FROM user_day_exercises;
