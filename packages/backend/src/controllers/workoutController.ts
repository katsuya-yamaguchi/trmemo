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

// ユーザーのトレーニング履歴を取得する関数
export const getWorkoutHistory = async (req: Request, res: Response) => {
  try {
    // 認証ミドルウェアからユーザーIDを取得
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '認証されていません' });
    }

    // クエリパラメータからページネーション情報を取得 (デフォルト値設定)
    const limit = parseInt(req.query.limit as string || '5', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    // 1. ユーザーのトレーニングセッションを新しい順に取得 (ページネーション適用)
    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id, start_time, duration') // 必要なカラムを選択
      .eq('user_id', userId)
      .order('start_time', { ascending: false }) // 新しい順
      .range(offset, offset + limit - 1); // ページネーション

    if (sessionsError) {
      console.error('Error fetching workout history (sessions):', sessionsError);
      return res.status(500).json({ message: 'トレーニング履歴の取得に失敗しました(セッション)', error: sessionsError.message });
    }

    if (!sessions || sessions.length === 0) {
      return res.status(200).json([]); // 履歴がない場合は空配列を返す
    }

    // 2. 各セッションの詳細情報（種目数やハイライト）を取得
    //    効率化のため、セッションIDのリストを作成して一度に問い合わせる
    const sessionIds = sessions.map(s => s.id);

    const { data: exercisesInSessions, error: exercisesError } = await supabase
      .from('session_exercises')
      .select('session_id, exercise_name, weight, reps')
      .in('session_id', sessionIds);

    if (exercisesError) {
      console.error('Error fetching workout history (exercises):', exercisesError);
      return res.status(500).json({ message: 'トレーニング履歴の取得に失敗しました(エクササイズ)', error: exercisesError.message });
    }

    // 3. セッションごとにデータを整形してレスポンスを作成
    const formattedHistory = sessions.map(session => {
      const exercisesForThisSession = exercisesInSessions?.filter(ex => ex.session_id === session.id) || [];

      // 種目数を計算
      const exerciseCount = new Set(exercisesForThisSession.map(ex => ex.exercise_name)).size;

      // ハイライトを作成 (例: 最も重い重量を扱った種目)
      let highlights = "記録なし";
      if (exercisesForThisSession.length > 0) {
        const heaviestSet = exercisesForThisSession.reduce((max, current) =>
          (current.weight || 0) > (max.weight || 0) ? current : max
        , exercisesForThisSession[0]);
        if(heaviestSet && heaviestSet.weight && heaviestSet.reps) {
            highlights = `${heaviestSet.exercise_name} ${heaviestSet.weight}kg x ${heaviestSet.reps}回`;
        } else if (heaviestSet) {
            highlights = `${heaviestSet.exercise_name} ${heaviestSet.reps}回`; //自重など
        }
      }

      return {
        id: session.id, // セッションIDも返すように変更 (詳細画面遷移用)
        date: formatDateForHistory(new Date(session.start_time)), // 日付フォーマット関数 (後述)
        title: `トレーニング (${formatDuration(session.duration)})`, // 仮のタイトル (期間を追加)
        highlights: highlights,
        exercises: exerciseCount, // モバイル側は数値を期待しているので '種目' はつけない
      };
    });

    return res.status(200).json(formattedHistory);

  } catch (error) {
    console.error('Unexpected error in getWorkoutHistory:', error);
    return res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

// 日付を 'YYYY/MM/DD' 形式にフォーマットする関数 (例)
function formatDateForHistory(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// Interval 型の duration を 'XX分' 形式にフォーマットする関数 (PostgreSQL Interval 想定)
function formatDuration(duration: any): string {
    if (!duration) return '記録なし';
    // duration が { hours: H, minutes: M, seconds: S } のようなオブジェクトと仮定
    // または 'HH:MM:SS' 形式の文字列をパース
    // ここでは単純化して合計分を返す例（実際のdurationの型に合わせて要調整）
    let totalMinutes = 0;
    if (typeof duration === 'object' && duration !== null) {
        totalMinutes = (duration.hours || 0) * 60 + (duration.minutes || 0) + Math.round((duration.seconds || 0) / 60);
    } else if (typeof duration === 'string') {
        // 'HH:MM:SS' のパースなどが必要
        // 簡単な例: '0 years 0 mons 0 days 1 hours 10 mins 0.0 secs' のような形式を仮定
         const match = duration.match(/(\d+)\s+hours.*?(\d+)\s+mins/);
         if(match && match.length >= 3) {
             totalMinutes = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
         } else {
             // パース失敗時のフォールバック
             return '記録なし';
         }
    }
    return totalMinutes > 0 ? `${totalMinutes}分` : '記録なし';
}

// 進捗データを取得する関数
export const getProgressData = async (req: Request, res: Response) => {
  try {
    // 認証とパラメータ取得
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: '認証されていません' });
    }
    const dataType = (req.query.dataType as string) || 'weight'; // デフォルトは 'weight'
    const period = (req.query.period as string) || 'month'; // デフォルトは 'month'

    // 期間に基づいて日付範囲を計算
    const { startDate, endDate, previousStartDate, previousEndDate } = calculateDateRange(period);
    const { labels, intervalFormat } = generateChartLabels(startDate, endDate, period);

    let chartData: any = { labels: [], datasets: [{ data: [] }] };
    let stats: any = {};

    // データタイプに応じて処理を分岐
    switch (dataType) {
      case 'weight':
        // --- 体重データの処理 ---
        // 仮定: body_stats テーブル (user_id, weight, recorded_at) が存在する
        const { data: weightData, error: weightError } = await supabase
          .from('body_stats') // このテーブル名は仮です。実際のテーブル名に合わせる
          .select('weight, recorded_at')
          .eq('user_id', userId)
          .gte('recorded_at', startDate.toISOString())
          .lte('recorded_at', endDate.toISOString())
          .order('recorded_at', { ascending: true });

        if (weightError) throw new Error(`体重データの取得エラー: ${weightError.message}`);

        // チャートデータの生成 (期間内の各ラベルに対応する最後の記録を採用する例)
        chartData = formatChartData(weightData || [], labels, intervalFormat, 'recorded_at', 'weight');

        // 統計データの計算 (先月比など)
        const { data: previousWeightData } = await supabase
          .from('body_stats')
          .select('weight')
          .eq('user_id', userId)
          .gte('recorded_at', previousStartDate.toISOString())
          .lte('recorded_at', previousEndDate.toISOString())
          .order('recorded_at', { ascending: false }) // 最新の記録を取得
          .limit(1);

        const latestWeight = weightData?.[weightData.length - 1]?.weight;
        const previousLatestWeight = previousWeightData?.[0]?.weight;
        let weightChange = 0;
        if (latestWeight && previousLatestWeight) {
            weightChange = parseFloat((latestWeight - previousLatestWeight).toFixed(1));
        }
        stats = { change: weightChange };
        break;

      case 'strength':
        // --- 筋力データの処理 (例: ベンチプレスの最大重量) ---

        // 1. ユーザーIDと期間に該当するセッションIDを取得
        const { data: relevantSessions, error: relevantSessionsError } = await supabase
            .from('sessions')
            .select('id') // セッションIDのみ取得
            .eq('user_id', userId)
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString());

        if (relevantSessionsError) {
            throw new Error(`セッションIDの取得エラー: ${relevantSessionsError.message}`);
        }

        const sessionIds = relevantSessions?.map(s => s.id) || [];

        // 該当セッションがない場合は空データを返す
        if (sessionIds.length === 0) {
          chartData = { labels: labels, datasets: [{ data: labels.map(() => 0) }] }; // 空のチャートデータ
          stats = { maxWeights: [{ name: 'ベンチプレス', weight: 0 }] }; // デフォルト統計
          break; // switch 文を抜ける
        }

        // 2. 取得したセッションIDリストと種目名で session_exercises をフィルタリング
        const targetExercise = 'ベンチプレス'; // 対象とする種目
        const { data: strengthData, error: strengthError } = await supabase
          .from('session_exercises')
          .select('weight, created_at')
          .in('session_id', sessionIds)      // <- session_id でフィルタリング
          .eq('exercise_name', targetExercise) // <- 種目名でフィルタリング
          // .gte/.lte は session_id でフィルタ済みなので不要 (created_at でフィルタしたい場合は残す)
          .order('created_at', { ascending: true });

        if (strengthError) {
          // このエラーメッセージは正しくなるはず
          throw new Error(`筋力データの取得エラー: ${strengthError.message}`);
        }

        // チャートデータの生成 (期間内の各ラベルに対応する最大重量を採用する例)
        chartData = formatChartData(strengthData || [], labels, intervalFormat, 'created_at', 'weight', true); // max を使う

        // 統計データの計算 (期間内の自己ベスト)
        const maxWeightRecord = (strengthData || []).reduce((max, current) =>
          (current.weight || 0) > (max.weight || 0) ? current : max
        , { weight: 0 });

        stats = {
            maxWeights: [{
                name: targetExercise,
                weight: maxWeightRecord.weight || 0
            }]
        };
        break;

      case 'workouts':
        // --- トレーニング数データの処理 ---
        const { data: workoutCountData, error: workoutCountError } = await supabase
          .from('sessions')
          .select('start_time')
          .eq('user_id', userId)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());

        if (workoutCountError) throw new Error(`トレーニング数データの取得エラー: ${workoutCountError.message}`);

        // チャートデータの生成 (期間内の各ラベルに対応するセッション数をカウント)
        chartData = formatCountChartData(workoutCountData || [], labels, intervalFormat, 'start_time');

        // 統計データの計算 (例: 今週のトレーニング回数 vs 目標)
        const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // 週の始まりを月曜に
        const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        const workoutsThisWeek = (workoutCountData || []).filter(s => {
            const startTime = new Date(s.start_time);
            return startTime >= thisWeekStart && startTime <= thisWeekEnd;
        }).length;
        const weeklyTarget = 5; // 仮の目標値
        stats = { total: workoutsThisWeek, target: weeklyTarget };
        break;

      default:
        return res.status(400).json({ message: '無効なデータタイプです' });
    }

    // レスポンスを返す
    return res.status(200).json({ chartData, stats });

  } catch (error) {
    console.error(`Error fetching progress data (${req.query.dataType}, ${req.query.period}):`, error);
    let errorMessage = 'サーバーエラーが発生しました';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return res.status(500).json({ message: errorMessage });
  }
};

// --- ヘルパー関数 ---

// 期間に基づいて日付範囲を計算
function calculateDateRange(period: string) {
  const now = new Date();
  let startDate: Date, endDate: Date, previousStartDate: Date, previousEndDate: Date;

  endDate = new Date(); // 常に今日まで

  switch (period) {
    case 'week':
      startDate = startOfWeek(now, { weekStartsOn: 1 }); // 月曜始まり
      previousStartDate = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      previousEndDate = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      break;
    case 'year':
      startDate = startOfYear(now);
      previousStartDate = startOfYear(subDays(now, 365));
      previousEndDate = endOfYear(subDays(now, 365));
      break;
    case 'month': // default to month
    default:
      startDate = startOfMonth(now);
      previousStartDate = startOfMonth(subDays(now, 30)); // 簡易的に30日前
      previousEndDate = endOfMonth(subDays(now, 30));
      break;
  }
  return { startDate, endDate, previousStartDate, previousEndDate };
}

// チャートのラベルを生成
function generateChartLabels(startDate: Date, endDate: Date, period: string): { labels: string[], intervalFormat: (date: Date) => string } {
    let labels: string[] = [];
    let intervalFormat: (date: Date) => string;

    switch (period) {
        case 'week':
            // 週表示: 月, 火, ..., 日
            labels = eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'M/d')); // or 'EEE' for 曜
            intervalFormat = (date: Date) => format(date, 'yyyy-MM-dd');
            break;
        case 'year':
            // 年表示: 1月, 2月, ..., 12月
            labels = eachMonthOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'M月'));
            intervalFormat = (date: Date) => format(date, 'yyyy-MM');
            break;
        case 'month': // default to month
        default:
            // 月表示: 1週目, 2週目, ... または 日付
             // labels = eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'd')); // 日にち
             // labels = ['W1', 'W2', 'W3', 'W4', 'W5']; // 週ごと (週の区切りを正確に計算する必要あり)
             // 簡単のため日ごとにする
            labels = eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'd')); // 日付
            intervalFormat = (date: Date) => format(date, 'yyyy-MM-dd');
            break;
    }
    return { labels, intervalFormat };
}


// データからチャート形式に整形 (平均値 or 最大値)
function formatChartData(
    data: any[],
    labels: string[],
    intervalFormat: (date: Date) => string,
    dateField: string,
    valueField: string,
    useMax: boolean = false // 最大値を使うか、最後の値を使うか
): { labels: string[], datasets: [{ data: number[] }] } {

    const datasetData = labels.map(labelKeyPart => {
        // labels 配列が日付のどの部分を表すかに基づいてフィルタリングキーを作成する必要がある
        // ここでは intervalFormat を使って日付をラベルの期間形式に変換してグループ化
        const valuesInInterval = data
            .filter(item => {
                if (!item[dateField]) return false;
                // intervalFormat(new Date(item[dateField])) が labels のどの要素に対応するか判定する必要がある
                // 例: labelsが'1', '2'... の場合、 format(new Date(item[dateField]), 'd') === labelKeyPart
                // 例: labelsが'M/d'の場合、format(new Date(item[dateField]), 'M/d') === labelKeyPart
                // 例: labelsが'M月'の場合、format(new Date(item[dateField]), 'M月') === labelKeyPart
                 try {
                    // この部分のロジックは labels の生成方法に依存するため調整が必要
                    // 簡単な例: 日付ラベルの場合 (labels が 'd' または 'M/d')
                    if (labels[0].includes('/')) { // 'M/d'
                        return format(new Date(item[dateField]), 'M/d') === labelKeyPart;
                    } else if (!isNaN(parseInt(labels[0]))) { // 'd'
                         return format(new Date(item[dateField]), 'd') === labelKeyPart;
                    } else if (labels[0].includes('月')) { // 'M月'
                        return format(new Date(item[dateField]), 'M月') === labelKeyPart;
                    }
                    return false; // 不明なラベル形式
                 } catch { return false; } // 不正な日付データは無視
            })
            .map(item => item[valueField])
            .filter(value => value !== null && !isNaN(parseFloat(value))); // 数値のみ抽出

        if (valuesInInterval.length === 0) return 0; // データがない期間は0

        if (useMax) {
            return Math.max(...valuesInInterval.map(v => parseFloat(v)));
        } else {
            // 最後の記録を採用 (データは日付順にソートされている想定)
            return parseFloat(valuesInInterval[valuesInInterval.length - 1]);
        }
    });

    return { labels, datasets: [{ data: datasetData }] };
}

// データから件数チャート形式に整形
function formatCountChartData(
    data: any[],
    labels: string[],
    intervalFormat: (date: Date) => string,
    dateField: string
): { labels: string[], datasets: [{ data: number[] }] } {

     const datasetData = labels.map(labelKeyPart => {
         const countInInterval = data.filter(item => {
             if (!item[dateField]) return false;
              try {
                 // formatChartData と同様のロジックでラベルに対応するデータをフィルタ
                 if (labels[0].includes('/')) { return format(new Date(item[dateField]), 'M/d') === labelKeyPart; }
                 else if (!isNaN(parseInt(labels[0]))) { return format(new Date(item[dateField]), 'd') === labelKeyPart; }
                 else if (labels[0].includes('月')) { return format(new Date(item[dateField]), 'M月') === labelKeyPart; }
                 return false;
              } catch { return false; }
         }).length; // 件数をカウント
         return countInInterval;
     });

     return { labels, datasets: [{ data: datasetData }] };
}
