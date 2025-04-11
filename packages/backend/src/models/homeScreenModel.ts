// 今日のワークアウト情報
export type TodayWorkout = {
  title: string;
  day: string;
  program: string;
  exercises: Exercise[];
  duration: string;
};

// ワークアウトの種目情報
export type Exercise = {
  name: string;
  sets: number;
  reps: number | string;
};

// 週間進捗情報
export type WeeklyProgress = {
  completed: number;
  total: number;
  percentage: number;
};

// 達成情報
export type Achievement = {
  title: string;
  date: string;
  value: string;
};

// トレーニングヒント
export type TrainingTip = {
  content: string;
  category: string;
};

// ホーム画面のレスポンス型
export type HomeScreenData = {
  todayWorkout: TodayWorkout;
  weeklyProgress: WeeklyProgress;
  recentAchievement: Achievement;
  trainingTip: TrainingTip;
};
