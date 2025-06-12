import { Exercise } from './exercise';

// ワークアウト内のエクササイズ
export type WorkoutExercise = {
  id: string;
  exercise_id: string;
  exercise?: Exercise; // JOIN結果
  order_index: number;
  set_count: number;
  rep_min?: number;
  rep_max?: number;
  reps: string;
  default_weight?: string;
  rest_seconds: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

// ワークアウト
export type Workout = {
  id: string;
  user_id: string;
  title: string;
  estimated_duration?: number;
  notes?: string;
  exercises: WorkoutExercise[];
  created_at: string;
  updated_at: string;
};

// ワークアウト作成リクエスト
export type CreateWorkoutRequest = {
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
};

// ワークアウト更新リクエスト
export type UpdateWorkoutRequest = {
  title?: string;
  estimated_duration?: number;
  notes?: string;
  exercises?: {
    id?: string; // 既存のエクササイズを更新する場合
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
};

// ワークアウト一覧レスポンス
export type WorkoutsResponse = {
  workouts: Workout[];
};

// ワークアウト詳細レスポンス
export type WorkoutResponse = {
  workout: Workout;
}; 