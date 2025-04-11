// src/models/workoutModel.ts

// ユーザーの基本トレーニングプラン
export type TrainingPlan = {
  id: number;
  user_id: string;
  plan_text: string | null;
  valid_from: Date | null;
  valid_to: Date | null;
  created_at: Date;
  updated_at: Date;
};

// カスタマイズされたトレーニングプラン
export type UserTrainingPlan = {
  id: string;
  user_id: string;
  name: string;
  base_plan_id: number;
  start_date: Date;
  created_at: Date;
};

// トレーニング日の定義
export type UserTrainingDay = {
  id: string;
  user_training_plan_id: string;
  day_number: number;
  title: string;
  estimated_duration: number; // 分単位
  created_at: Date;
};

// 種目の定義
export type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  description: string | null;
  created_at: Date;
};

// 日ごとの種目設定
export type UserDayExercise = {
  id: string;
  user_training_day_id: string;
  exercise_id: string;
  set_count: number;
  rep_min: number;
  rep_max: number;
  created_at: Date;
};

// セットごとの記録
export type UserExerciseSet = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed_at: Date;
  created_at: Date;
};
