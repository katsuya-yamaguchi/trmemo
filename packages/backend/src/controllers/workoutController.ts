// src/controllers/workoutController.ts
import { Request, Response } from 'express';
import supabase from '../config/database';
import { UserTrainingPlan, UserTrainingDay, UserDayExercise, Exercise } from '../models/workoutModel';

// ユーザーのトレーニングプランを取得
export const getUserTrainingPlan = async (req: Request, res: Response) => {
  try {
    // 認証トークンからユーザーIDを取得する代わりに、クエリパラメータから取得
    // 本番環境では適切な認証が必要
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDが必要です' });
    }

    const { data: plan, error: planError } = await supabase
      .from('user_training_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (planError) {
      return res.status(404).json({ message: 'トレーニングプランが見つかりません', error: planError });
    }

    // トレーニング日を取得
    const { data: days, error: daysError } = await supabase
      .from('user_training_days')
      .select(`
        *,
        user_day_exercises (
          *,
          exercise: exercises (*)
        )
      `)
      .eq('user_training_plan_id', plan.id)
      .order('day_number');

    if (daysError) {
      return res.status(404).json({ message: 'トレーニング日の取得に失敗しました', error: daysError });
    }

    res.json({
      plan,
      days
    });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};

// 特定の日のトレーニングを取得
export const getDayWorkout = async (req: Request, res: Response) => {
  try {
    const { dayId } = req.params;

    const { data: dayWorkout, error } = await supabase
      .from('user_training_days')
      .select(`
        *,
        user_day_exercises (
          *,
          exercise: exercises (*)
        )
      `)
      .eq('id', dayId)
      .single();

    if (error) {
      return res.status(404).json({ message: 'トレーニングが見つかりません', error });
    }

    res.json(dayWorkout);
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};

// トレーニングセッションの記録を保存
export const recordExerciseSet = async (req: Request, res: Response) => {
  try {
    const { sessionId, exerciseId, setNumber, weight, reps } = req.body;

    const { data, error } = await supabase
      .from('user_exercise_sets')
      .insert({
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight,
        reps,
        completed_at: new Date(),
      })
      .single();

    if (error) {
      return res.status(400).json({ message: 'セットの記録に失敗しました', error });
    }

    res.json(data);
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};