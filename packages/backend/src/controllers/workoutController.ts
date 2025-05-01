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

// プログレスデータを取得
export const getProgressData = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const dataType = req.query.dataType as string || 'weight'; // 'weight', 'strength', 'workouts'
    const period = req.query.period as string || 'month'; // 'week', 'month', 'year'

    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDが必要です' });
    }

    let chartData = null;
    let stats = null;

    if (dataType === 'weight') {
      // 体重データを取得
      const response = await getWeightProgressData(userId, period);
      chartData = response.chartData;
      stats = response.stats;
    } else if (dataType === 'strength') {
      // 筋力データを取得
      const response = await getStrengthProgressData(userId, period);
      chartData = response.chartData;
      stats = response.stats;
    } else if (dataType === 'workouts') {
      // トレーニング頻度データを取得
      const response = await getWorkoutFrequencyData(userId, period);
      chartData = response.chartData;
      stats = response.stats;
    }

    res.json({
      chartData,
      stats
    });
  } catch (error) {
    console.error('プログレスデータ取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};

// 体重の推移データを取得
const getWeightProgressData = async (userId: string, period: string) => {
  // 期間に基づいて日付範囲を計算
  const endDate = new Date();
  const startDate = new Date();
  
  if (period === 'week') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(endDate.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(endDate.getFullYear() - 1);
  }

  // 体重履歴を取得
  const { data } = await supabase
    .from('user_body_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('recorded_date', startDate.toISOString())
    .lte('recorded_date', endDate.toISOString())
    .order('recorded_date');

  // 最新の体重と開始時の体重を計算
  let currentWeight = null;
  let startWeight = null;
  let weightChange = null;

  if (data && data.length > 0) {
    currentWeight = data[data.length - 1].weight;
    startWeight = data[0].weight;
    weightChange = currentWeight - startWeight;
  }

  // チャート用にデータを整形
  const chartData = formatChartData(data, 'weight', period);

  return {
    chartData,
    stats: {
      current: currentWeight,
      start: startWeight,
      change: weightChange
    }
  };
};

// 筋力データの推移を取得
const getStrengthProgressData = async (userId: string, period: string) => {
  // 期間に基づいて日付範囲を計算
  const endDate = new Date();
  const startDate = new Date();
  
  if (period === 'week') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(endDate.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(endDate.getFullYear() - 1);
  }

  // 主要エクササイズの最大重量を取得
  const exercises = ['ベンチプレス', 'スクワット', 'デッドリフト'];
  let maxWeights = [];

  for (const exerciseName of exercises) {
    const { data } = await supabase
      .from('session_exercises')
      .select(`
        *,
        session: sessions (
          start_time,
          user_id
        )
      `)
      .eq('exercise_name', exerciseName)
      .eq('session.user_id', userId)
      .gte('session.start_time', startDate.toISOString())
      .lte('session.start_time', endDate.toISOString())
      .order('weight', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      maxWeights.push({
        name: exerciseName,
        weight: data[0].weight
      });
    }
  }

  // チャート用データを作成
  const chartData = {
    labels: maxWeights.map(item => item.name),
    datasets: [
      {
        data: maxWeights.map(item => item.weight)
      }
    ]
  };

  return {
    chartData,
    stats: {
      maxWeights
    }
  };
};

// トレーニング頻度データを取得
const getWorkoutFrequencyData = async (userId: string, period: string) => {
  // 期間に基づいて日付範囲を計算
  const endDate = new Date();
  const startDate = new Date();
  
  if (period === 'week') {
    startDate.setDate(endDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setDate(endDate.getDate() - 30);
  } else if (period === 'year') {
    startDate.setMonth(endDate.getMonth() - 12);
  }

  // セッションデータを取得
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time');

  let labels = [];
  let values = [];

  if (period === 'week') {
    // 週の場合は曜日ごとにカウント
    const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
    const daysCounts = Array(7).fill(0);
    
    sessions?.forEach(session => {
      const date = new Date(session.start_time);
      const dayIndex = date.getDay();
      daysCounts[dayIndex]++;
    });
    
    labels = daysOfWeek;
    values = daysCounts;
  } else if (period === 'month') {
    // 月の場合は週ごとにカウント
    const weeksCounts = Array(4).fill(0);
    
    sessions?.forEach(session => {
      const date = new Date(session.start_time);
      const dayOfMonth = date.getDate();
      const weekIndex = Math.floor(dayOfMonth / 7);
      weeksCounts[Math.min(weekIndex, 3)]++;
    });
    
    labels = ['第1週', '第2週', '第3週', '第4週'];
    values = weeksCounts;
  } else {
    // 年の場合は月ごとにカウント
    const monthsCounts = Array(12).fill(0);
    
    sessions?.forEach(session => {
      const date = new Date(session.start_time);
      const monthIndex = date.getMonth();
      monthsCounts[monthIndex]++;
    });
    
    labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    values = monthsCounts;
  }

  // チャート用データを作成
  const chartData = {
    labels,
    datasets: [
      {
        data: values
      }
    ]
  };

  // 統計データ
  const totalWorkouts = sessions?.length || 0;
  const targetWorkouts = period === 'week' ? 5 : period === 'month' ? 20 : 240;
  const completionRate = totalWorkouts / targetWorkouts;

  return {
    chartData,
    stats: {
      total: totalWorkouts,
      target: targetWorkouts,
      completionRate
    }
  };
};

// チャート用データを整形
const formatChartData = (data, dataType, period) => {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [{ data: [] }] };
  }

  const formatDate = (date) => {
    if (period === 'week') {
      return date.toLocaleDateString('ja-JP', { weekday: 'short' });
    } else if (period === 'month') {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    } else {
      return `${date.getMonth() + 1}月`;
    }
  };

  // 日付でグループ化
  const groupedData = {};
  
  data.forEach(item => {
    const date = new Date(item.recorded_date);
    const dateKey = formatDate(date);
    
    if (!groupedData[dateKey]) {
      groupedData[dateKey] = [];
    }
    
    groupedData[dateKey].push(item);
  });

  // 各日付の平均値を計算
  const labels = Object.keys(groupedData);
  const values = labels.map(label => {
    const items = groupedData[label];
    const sum = items.reduce((acc, item) => acc + item[dataType], 0);
    return sum / items.length;
  });

  return {
    labels,
    datasets: [
      {
        data: values
      }
    ]
  };
};

// ワークアウト履歴を取得
export const getWorkoutHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const limit = parseInt(req.query.limit as string) || 5;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!userId) {
      return res.status(400).json({ message: 'ユーザーIDが必要です' });
    }

    // セッション履歴を取得
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_training_days (
          training_day: user_training_days (
            title
          )
        ),
        session_exercises (
          exercise_name,
          weight,
          reps
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessionsError) {
      return res.status(400).json({ message: 'トレーニング履歴の取得に失敗しました', error: sessionsError });
    }

    // レスポンス用にデータを整形
    const workoutHistory = sessions?.map(session => {
      // タイトルを取得
      const title = session.session_training_days[0]?.training_day?.title || 'カスタムトレーニング';
      
      // 日付をフォーマット
      const date = new Date(session.start_time);
      const formattedDate = date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' });
      
      // ハイライトを作成（最大重量のエクササイズ）
      let highlight = '';
      let maxWeight = 0;
      let maxWeightExercise = '';
      
      session.session_exercises.forEach(exercise => {
        if (exercise.weight > maxWeight) {
          maxWeight = exercise.weight;
          maxWeightExercise = exercise.exercise_name;
        }
      });
      
      if (maxWeightExercise) {
        highlight = `${maxWeightExercise} ${maxWeight}kg`;
      }

      return {
        id: session.id,
        date: formattedDate,
        title,
        highlights: highlight,
        exercises: session.session_exercises.length
      };
    }) || [];

    res.json(workoutHistory);
  } catch (error) {
    console.error('ワークアウト履歴取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラー' });
  }
};
