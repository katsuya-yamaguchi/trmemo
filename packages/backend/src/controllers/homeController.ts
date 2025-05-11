// src/controllers/homeController.ts
import { Request, Response } from 'express';
import supabase from '../config/database';
import { HomeScreenData } from '../models/homeScreenModel';

// Define the type for the exercise item
interface UserDayExerciseItem {
  exercise: {
    name: string;
  };
  set_count: number;
  rep_min: number;
  rep_max: number;
  // Add other properties from user_day_exercises if accessed elsewhere or for completeness
}

export class HomeController {
  async getHomeScreenData(req: Request, res: Response) {
  try {
      // ミドルウェアによって req.user に認証済みユーザーIDが設定されているはず
      const userId = req.user?.id; // ★クエリパラメータではなく req.user.id を使用★

    if (!userId) {
        // 通常、ミドルウェアで弾かれるはずだが念のため
        return res.status(401).json({ message: '認証されていません' });
    }

    // 今日のワークアウト情報を取得
    const { data: userTrainingPlan, error: planError } = await supabase
      .from('user_training_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (planError) {
      return res.status(404).json({ message: 'トレーニングプランが見つかりません', error: planError });
    }

    // 曜日または日付から今日のトレーニングを決定
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 日曜, 1: 月曜, ...
    const dayNumber = (dayOfWeek === 0) ? 7 : dayOfWeek; // 日曜を7とする

    const { data: todayTraining, error: trainingError } = await supabase
      .from('user_training_days')
      .select(`
        *,
        user_day_exercises (
          *,
          exercise: exercises (*)
        )
      `)
      .eq('user_training_plan_id', userTrainingPlan.id)
      .eq('day_number', dayNumber)
      .single();

    if (trainingError) {
      // 今日のトレーニングがない場合は休息日とする
      return res.status(200).json(generateRestDayResponse(userId));
    }

    // トレーニング種目から今日のワークアウト情報を生成
    const exercises = todayTraining.user_day_exercises.map((exercise: UserDayExerciseItem) => ({
      name: exercise.exercise.name,
      sets: exercise.set_count,
      reps: `${exercise.rep_min}-${exercise.rep_max}`
    }));

    // 週間進捗情報を取得
    const weekStart = new Date();
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const { data: weekSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString());

    if (sessionsError) {
      console.error('週間セッション取得エラー:', sessionsError);
    }

    // 達成情報を取得（最新のセッションの中から最大重量など）
    const { data: recentAchievement, error: achievementError } = await supabase
      .from('session_exercises')
      .select(`
        *,
        session: sessions (
          start_time
        )
      `)
      .eq('exercise_name', 'ベンチプレス')
      .order('weight', { ascending: false })
      .limit(1)
      .single();

    // ホーム画面データを生成
    const homeData: HomeScreenData = {
      todayWorkout: {
        title: todayTraining.title,
        day: `Day ${todayTraining.day_number}`,
        program: userTrainingPlan.name,
        exercises: exercises,
        duration: `${todayTraining.estimated_duration}分`
      },
      weeklyProgress: {
        completed: weekSessions?.length || 0,
        total: 5, // 週のトレーニング目標日数
        percentage: weekSessions ? (weekSessions.length / 5) * 100 : 0
      },
      recentAchievement: recentAchievement ? {
        title: `${recentAchievement.exercise_name}自己ベスト更新`,
        date: formatDate(new Date(recentAchievement.session.start_time)),
        value: `${recentAchievement.weight}kg`
      } : {
        title: "まだ達成記録がありません",
        date: "今日",
        value: ""
      },
      trainingTip: {
        content: "胸筋トレーニングでは、ベンチプレスの際に肩甲骨を寄せることで、より効果的に大胸筋を刺激することができます。",
        category: "technique"
      }
    };

      return res.status(200).json(homeData);
  } catch (error) {
    console.error('ホーム画面データ取得エラー:', error);
      return res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
  }
}

// 休息日用のレスポンスを生成
const generateRestDayResponse = (userId: string): HomeScreenData => {
  return {
    todayWorkout: {
      title: "休息日",
      day: "Rest Day",
      program: "週5日プログラム",
      exercises: [],
      duration: "0分"
    },
    weeklyProgress: {
      completed: 0,
      total: 5,
      percentage: 0
    },
    recentAchievement: {
      title: "まだ達成記録がありません",
      date: "今日",
      value: ""
    },
    trainingTip: {
      content: "休息日は筋肉の回復と成長に重要です。軽いストレッチやウォーキングがおすすめです。",
      category: "recovery"
    }
  };
};

// 日付をフォーマット
const formatDate = (date: Date): string => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  if (date.toDateString() === now.toDateString()) {
    return "今日";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "昨日";
  } else {
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  }
};