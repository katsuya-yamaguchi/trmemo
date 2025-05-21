// src/controllers/workoutController.ts
import { Request, Response } from 'express';
import supabase from '../config/database';
import { UserTrainingPlan, UserTrainingDay, UserDayExercise, Exercise } from '../models/workoutModel';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns'; // date-fns をインストールする必要があるかも (npm install date-fns)

// ユーザーのトレーニングプランを取得
export const getUserTrainingPlan = async (req: Request, res: Response) => {
  try {
    // 認証ミドルウェアからユーザーIDを取得
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '認証されていません' });
    }

    // 1. ユーザーの最新（またはアクティブな）トレーニングプランを取得
    //   単純化のため、ここではユーザーに紐づく最初のプランを取得する例
    const { data: userPlan, error: planError } = await supabase
      .from('user_training_plans')
      .select('*')
      .eq('user_id', userId)
      // .order('created_at', { ascending: false }) // 必要なら最新のプランを取得
      .limit(1)
      .maybeSingle(); // プランがなくてもエラーにしない

    if (planError) {
      console.error('Error fetching user training plan:', planError);
      return res.status(500).json({ message: 'トレーニングプランの取得に失敗しました', error: planError.message });
    }

    // プランが見つからない場合
    if (!userPlan) {
      return res.status(404).json({ message: '有効なトレーニングプランが見つかりません' });
    }

    // 2. プランに紐づくトレーニング日と、各日のエクササイズを取得
    //    ネストされたSELECTを使用
    const { data: trainingDaysWithExercises, error: daysError } = await supabase
      .from('user_training_days')
      .select(`
        id,
        day_number,
        title,
        estimated_duration,
        user_day_exercises (
          set_count,
          rep_min,
          rep_max,
          exercise: exercises ( id, name ) 
        )
      `)
      .eq('user_training_plan_id', userPlan.id)
      .order('day_number', { ascending: true }); // 曜日順にソート

    if (daysError) {
      console.error('Error fetching training days and exercises:', daysError);
      return res.status(500).json({ message: 'トレーニング日の取得に失敗しました', error: daysError.message });
    }

    // 3. モバイルアプリが期待する形式に整形
    const formattedTrainingDays = trainingDaysWithExercises.map(day => ({
      id: day.id,
      day_number: day.day_number,
      title: day.title,
      estimated_duration: day.estimated_duration,
      // user_day_exercises を整形
      exercises: day.user_day_exercises.map((ex: any) => ({ // any は一時的。必要なら型定義
        id: ex.exercise.id,
        name: ex.exercise.name,
        sets: ex.set_count,
        reps: `${ex.rep_min}-${ex.rep_max}` // rep_min と rep_max を結合
      }))
    }));

    // 最終的なレスポンスデータ
    const responseData = {
      id: userPlan.id,
      name: userPlan.name,
      startDate: userPlan.start_date, // start_date カラムが存在する場合
      trainingDays: formattedTrainingDays
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Unexpected error in getUserTrainingPlan:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
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

// トレーニングセッションの開始
export const startTrainingSession = async (req: Request, res: Response) => {
  try {
    const { userId, dayId } = req.body;

    if (!userId || !dayId) {
      return res.status(400).json({ message: 'ユーザーIDとトレーニング日IDが必要です' });
    }

    // セッションを作成
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        start_time: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      })
      .select()
      .single();

    if (sessionError) {
      return res.status(400).json({ message: 'セッションの作成に失敗しました', error: sessionError });
    }

    // セッションとトレーニング日を関連付け
    const { error: relationError } = await supabase
      .from('session_training_days')
      .insert({
        session_id: session.id,
        training_day_id: dayId
      });

    if (relationError) {
      return res.status(400).json({ message: 'セッションの関連付けに失敗しました', error: relationError });
    }

    res.json({
      message: 'トレーニングセッションを開始しました',
      session
    });
  } catch (error) {
    console.error('セッション開始エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};

// トレーニングセッションの終了
export const completeTrainingSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'セッションIDが必要です' });
    }

    // セッションを終了
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        end_time: new Date(),
        duration: calculateDuration(sessionId),
        updated_at: new Date()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: 'セッションの終了に失敗しました', error });
    }

    // セッションのサマリーを作成
    await createSessionSummary(sessionId);

    res.json({
      message: 'トレーニングセッションを完了しました',
      session
    });
  } catch (error) {
    console.error('セッション終了エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};

// セッションの時間を計算
const calculateDuration = async (sessionId: string) => {
  const { data: session } = await supabase
    .from('sessions')
    .select('start_time')
    .eq('id', sessionId)
    .single();

  if (!session) return null;

  const startTime = new Date(session.start_time);
  const endTime = new Date();
  
  // ミリ秒を秒に変換
  const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  
  return `${durationInSeconds} seconds`;
};

// セッションのサマリーを作成
const createSessionSummary = async (sessionId: string) => {
  try {
    // セッション情報を取得
    const { data: session } = await supabase
      .from('sessions')
      .select('user_id, start_time, end_time')
      .eq('id', sessionId)
      .single();

    if (!session) return;

    // セットの情報を取得
    const { data: sets } = await supabase
      .from('user_exercise_sets')
      .select('exercise_id, weight, reps')
      .eq('session_id', sessionId);

    // サマリーを作成
    let totalSets = 0;
    let totalReps = 0;
    let maxWeight = 0;
    let totalCalories = 0;

    if (sets && sets.length > 0) {
      totalSets = sets.length;
      totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
      maxWeight = Math.max(...sets.map(set => set.weight || 0));
      // 簡易的なカロリー計算（実際はもっと複雑）
      totalCalories = totalReps * 0.3;
    }

    // サマリーを保存
    await supabase
      .from('session_summaries')
      .insert({
        session_id: sessionId,
        user_id: session.user_id,
        summary_text: `セット数: ${totalSets}, 総回数: ${totalReps}, 最大重量: ${maxWeight}kg`,
        total_calories: totalCalories,
        created_at: new Date()
      });

  } catch (error) {
    console.error('セッションサマリー作成エラー:', error);
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

// エクササイズライブラリを取得
export const getExerciseLibrary = async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let query = supabase
      .from('exercises')
      .select('*');

    // カテゴリによるフィルタリング
    if (category && typeof category === 'string' && category !== 'all') {
      let dbCategory = category;
      if (category === 'chest') dbCategory = '胸';
      if (category === 'back') dbCategory = '背中';
      if (category === 'legs') dbCategory = '脚';
      if (category === 'shoulders') dbCategory = '肩';

      query = query.ilike('muscle_group', `%${dbCategory}%`);
    }

    // 検索クエリによるフィルタリング (name カラム)
    if (search && typeof search === 'string') {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching exercise library:', error);
      return res.status(500).json({ message: 'エクササイズの取得に失敗しました', error: error.message });
    }

    // モバイルアプリが期待する形式に整形 (difficulty と tips はダミー)
    const formattedExercises = data.map(ex => ({
      id: ex.id,
      name: ex.name,
      category: mapMuscleGroupToCategory(ex.muscle_group),
      difficulty: assignDummyDifficulty(ex.name),
      description: ex.description || '説明はありません。',
      tips: assignDummyTips(ex.name),
    }));

    return res.status(200).json(formattedExercises);

  } catch (error) {
    console.error('Unexpected error in getExerciseLibrary:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

// ヘルパー関数: DBの部位名をモバイルカテゴリに変換 (例)
// DBスキーマや要件に合わせて調整が必要
function mapMuscleGroupToCategory(muscleGroup: string | null): string {
  if (!muscleGroup) return 'other';

  const lowerMuscleGroup = muscleGroup.toLowerCase();

  if (lowerMuscleGroup.includes('胸')) return 'chest';
  if (lowerMuscleGroup.includes('背中')) return 'back';
  if (lowerMuscleGroup.includes('脚') || lowerMuscleGroup.includes('尻')) return 'legs';
  if (lowerMuscleGroup.includes('肩')) return 'shoulders';
  if (lowerMuscleGroup.includes('腕') || lowerMuscleGroup.includes('三頭') || lowerMuscleGroup.includes('二頭')) return 'arms';
  if (lowerMuscleGroup.includes('腹')) return 'abs';

  return 'other';
}

// ヘルパー関数: ダミーの難易度を割り当て (例)
function assignDummyDifficulty(exerciseName: string): string {
  if (exerciseName.includes('デッドリフト') || exerciseName.includes('スクワット')) return '上級';
  if (exerciseName.includes('プレス') || exerciseName.includes('懸垂')) return '中級';
  return '初級';
}

// ヘルパー関数: ダミーのヒントを割り当て (例)
function assignDummyTips(exerciseName: string): string[] {
  if (exerciseName === 'ベンチプレス') return ["肩甲骨を寄せて胸を張る", "バーを下ろす際は胸の中央に向ける", "呼吸を意識し、押し上げる時に息を吐く"];
  if (exerciseName === 'スクワット') return ["足は肩幅より少し広めに開く", "膝がつま先より前に出ないようにする", "背筋をまっすぐに保つ"];
  if (exerciseName === 'デッドリフト') return ["背筋をまっすぐに保つ", "バーは常に身体の近くをキープする"];
  return ["正しいフォームを意識しましょう。", "無理のない重量設定で行いましょう。"];
}

// カテゴリーIDから日本語名へのマッピング
const categoryNameMap = {
  'chest': '胸',
  'back': '背中',
  'legs': '脚',
  'shoulders': '肩',
  'arms': '腕',
  'abs': '腹筋',
};

// 特定のエクササイズの詳細を取得
export const getExerciseDetails = async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single();

    if (error) {
      return res.status(404).json({ message: 'エクササイズが見つかりません', error });
    }

    // ヒントを取得（例として固定データを返す）
    const tips = [
      "肩甲骨を寄せて胸を張る",
      "バーを下ろす際は胸の中央に向ける",
      "呼吸を意識し、押し上げる時に息を吐く",
      "フォームを優先し、無理な重量は避ける"
    ];

    res.json({
      ...data,
      tips
    });
  } catch (error) {
    console.error('エクササイズ詳細取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};
