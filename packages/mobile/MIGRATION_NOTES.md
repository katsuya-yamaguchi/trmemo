# ワークアウト構造移行ノート

## 概要
複雑な4テーブル構造のトレーニングプランシステムから、シンプルな2テーブル構造のワークアウトシステムに移行しました。

## 移行日
2025年1月13日

## 変更内容

### 削除されたファイル
- `screens/training-screen.tsx` (旧)
- `screens/create-training-plan-screen.tsx`
- `screens/training-detail-screen.tsx`

### 新規作成されたファイル
- `types/workout.ts` - 新しいワークアウト構造の型定義
- `screens/training-screen.tsx` (新) - シンプルなワークアウト一覧画面
- `screens/create-workout-screen.tsx` - ワークアウト作成・編集画面
- `screens/workout-detail-screen.tsx` - ワークアウト詳細・実行画面

### 変更されたファイル
- `services/api.ts` - 新しいワークアウトAPI追加、古いトレーニングプランAPI削除
- `types/exercise.ts` - トレーニングプラン関連型定義削除
- `App.tsx` - ナビゲーション構造更新

## データベース構造の変更

### 旧構造（廃止）
```
training_plans (integer ID, base plans)
└── user_training_plans (UUID ID, user-specific plans)
    └── user_training_days (workout days)
        └── user_day_exercises (individual exercises)
```

### 新構造（現在）
```
user_workouts (direct workout management)
└── user_workout_exercises (exercises within workouts)
```

## API変更

### 廃止されたAPI
- `getTrainingPlan()`
- `createTrainingPlan()`
- `updateTrainingPlan()`
- `deleteTrainingPlan()`
- `getDayWorkout()`
- `updateDayWorkout()`
- `startTrainingSession()`
- `completeTrainingSession()`
- `recordExerciseSet()`

### 新しいAPI
- `getWorkouts()` - 全ワークアウト取得
- `getWorkout(id)` - 特定ワークアウト取得
- `createWorkout()` - ワークアウト作成
- `updateWorkout()` - ワークアウト更新
- `deleteWorkout()` - ワークアウト削除

## 利点

1. **シンプルな構造**: 4テーブルから2テーブルへ
2. **直接的な管理**: トレーニングプランの概念を排除
3. **高いパフォーマンス**: シンプルなクエリで高速データ取得
4. **柔軟性**: 各ワークアウトが独立して管理可能
5. **開発効率**: 理解しやすく保守しやすいコード

## 移行データ
- 既存の4ワークアウトが新構造に正常に移行済み
- 4エクササイズが適切な順序で移行済み
- 2ユーザーのデータが完全に保持済み

## 注意事項
- 古いトレーニングプラン関連のコードは完全に削除されました
- 新しいワークアウト構造のみを使用してください
- データベースの古いテーブルは段階的に削除予定です 