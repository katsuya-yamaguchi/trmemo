// 種目タイプ
export type ExerciseType = "barbell" | "dumbbell" | "band" | "machine" | "other";

// 種目
export type Exercise = {
  id: string;
  name: string;
  type: ExerciseType;
  imageUrl: string;
  description: string;
  targetMuscles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  created_at?: string;
  updated_at?: string;
};

// 種目ライブラリのレスポンス
export type ExerciseLibraryResponse = {
  exercises: Exercise[];
  total: number;
};

// 注意: トレーニングプラン関連の型は廃止されました
// 新しいワークアウト構造は packages/mobile/types/workout.ts を使用してください 