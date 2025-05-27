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

// トレーニングプランの種目
export type PlanExercise = {
  id: string;
  name: string;
  type: ExerciseType;
  imageUrl: string;
  description: string;
  targetMuscles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  equipment: string[];
  sets: number;
  reps: string;
  default_weight?: string;
};

// トレーニング日
export type TrainingDay = {
  id: string;
  day_number: number;
  title: string;
  estimated_duration: number;
  exercises: PlanExercise[];
};

// トレーニングプラン
export type TrainingPlan = {
  id: string;
  name: string;
  startDate?: string;
  trainingDays: TrainingDay[];
  created_at?: string;
  updated_at?: string;
}; 