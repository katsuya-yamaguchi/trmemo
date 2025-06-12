# 新しいトレーニング構造設計

## 現在の構造（複雑）
```
training_plans (基本プラン) 
  ↓ (base_plan_id)
user_training_plans (ユーザー固有プラン)
  ↓ (user_training_plan_id)
user_training_days (トレーニング日)
  ↓ (user_training_day_id)
user_day_exercises (エクササイズ)
  ↓ (exercise_id)
exercises (エクササイズマスタ)
```

## 新しい構造（シンプル）
```
user_workouts (ワークアウト = 1日のトレーニング)
  ↓ (user_workout_id)
user_workout_exercises (ワークアウト内のエクササイズ)
  ↓ (exercise_id)
exercises (エクササイズマスタ) - 既存のまま
```

## 新しいテーブル設計

### 1. user_workouts テーブル
```sql
CREATE TABLE user_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  estimated_duration INTEGER, -- 分単位
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

### 2. user_workout_exercises テーブル
```sql
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
```

### 3. exercises テーブル（既存のまま使用）
- 現在の構造をそのまま維持

## データ移行計画

### Phase 1: 新しいテーブル作成
1. `user_workouts` テーブル作成
2. `user_workout_exercises` テーブル作成
3. RLS ポリシー設定

### Phase 2: データ移行
既存データを新しい構造に移行：

```sql
-- user_training_days → user_workouts
INSERT INTO user_workouts (id, user_id, title, estimated_duration, created_at, updated_at)
SELECT 
  utd.id,
  utp.user_id,
  COALESCE(utd.title, 'ワークアウト ' || utd.day_number),
  utd.estimated_duration,
  utd.created_at,
  utd.updated_at
FROM user_training_days utd
JOIN user_training_plans utp ON utd.user_training_plan_id = utp.id
WHERE utp.user_id IS NOT NULL;

-- user_day_exercises → user_workout_exercises
INSERT INTO user_workout_exercises (
  id, user_workout_id, exercise_id, set_count, rep_min, rep_max, 
  reps, default_weight, created_at, updated_at
)
SELECT 
  ude.id,
  ude.user_training_day_id, -- これがuser_workout_idになる
  ude.exercise_id,
  ude.set_count,
  ude.rep_min,
  ude.rep_max,
  ude.reps,
  ude.default_weight,
  ude.created_at,
  ude.updated_at
FROM user_day_exercises ude
WHERE ude.user_training_day_id IN (
  SELECT id FROM user_workouts
);
```

### Phase 3: 古いテーブル削除（段階的）
1. アプリケーションコードを新しいテーブルに対応
2. 十分なテスト期間後、古いテーブルを削除：
   - `user_day_exercises`
   - `user_training_days`
   - `user_training_plans`
   - `training_plans`

## RLS ポリシー

### user_workouts
```sql
-- SELECT: 自分のワークアウトのみ
CREATE POLICY "Users can view own workouts" ON user_workouts
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: 自分のワークアウトのみ作成
CREATE POLICY "Users can create own workouts" ON user_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: 自分のワークアウトのみ更新
CREATE POLICY "Users can update own workouts" ON user_workouts
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: 自分のワークアウトのみ削除
CREATE POLICY "Users can delete own workouts" ON user_workouts
  FOR DELETE USING (auth.uid() = user_id);
```

### user_workout_exercises
```sql
-- SELECT: 自分のワークアウトのエクササイズのみ
CREATE POLICY "Users can view own workout exercises" ON user_workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_workouts 
      WHERE id = user_workout_exercises.user_workout_id 
      AND user_id = auth.uid()
    )
  );

-- INSERT: 自分のワークアウトにのみエクササイズ追加
CREATE POLICY "Users can create own workout exercises" ON user_workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_workouts 
      WHERE id = user_workout_exercises.user_workout_id 
      AND user_id = auth.uid()
    )
  );

-- UPDATE: 自分のワークアウトのエクササイズのみ更新
CREATE POLICY "Users can update own workout exercises" ON user_workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_workouts 
      WHERE id = user_workout_exercises.user_workout_id 
      AND user_id = auth.uid()
    )
  );

-- DELETE: 自分のワークアウトのエクササイズのみ削除
CREATE POLICY "Users can delete own workout exercises" ON user_workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_workouts 
      WHERE id = user_workout_exercises.user_workout_id 
      AND user_id = auth.uid()
    )
  );
```

## アプリケーション側の変更

### 新しいAPI構造
```typescript
// ワークアウト作成
interface CreateWorkoutRequest {
  title: string;
  estimated_duration?: number;
  notes?: string;
  exercises: {
    exercise_id: string;
    order_index: number;
    set_count: number;
    rep_min?: number;
    rep_max?: number;
    reps?: string;
    default_weight?: string;
    rest_seconds?: number;
    notes?: string;
  }[];
}

// ワークアウト取得
interface Workout {
  id: string;
  title: string;
  estimated_duration?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise: Exercise; // JOIN結果
  order_index: number;
  set_count: number;
  rep_min?: number;
  rep_max?: number;
  reps: string;
  default_weight?: string;
  rest_seconds: number;
  notes?: string;
}
```

## メリット

1. **シンプルな構造**: プラン概念を削除し、直接ワークアウトを管理
2. **柔軟性**: 各ワークアウトを独立して管理可能
3. **パフォーマンス**: JOINが少なくクエリが高速
4. **理解しやすさ**: 開発者にとって直感的な構造
5. **拡張性**: 将来的な機能追加が容易

## 移行スケジュール

1. **Week 1**: 新しいテーブル作成とRLS設定
2. **Week 2**: データ移行スクリプト実行とテスト
3. **Week 3**: アプリケーションコード更新
4. **Week 4**: 本番環境での動作確認
5. **Week 5**: 古いテーブル削除（バックアップ後） 