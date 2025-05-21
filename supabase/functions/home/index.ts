import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'; // CORSヘッダーを共通化 (必要に応じて作成)

// Define the type for the exercise item (Expressのものを流用・調整)
interface UserDayExerciseItem {
  exercise: {
    name: string;
  };
  set_count: number;
  rep_min: number;
  rep_max: number;
  // 必要に応じて他のプロパティも追加
}

// HomeScreenDataの型定義 (Expressのものを流用・調整)
interface HomeScreenData {
  todayWorkout: {
    title: string;
    day: string;
    program: string;
    exercises: {
      name: string;
      sets: number;
      reps: string;
    }[];
    duration: string;
  };
  weeklyProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  recentAchievement: {
    title: string;
    date: string;
    value: string;
  };
  trainingTip: {
    content: string;
    category: string;
  };
}

serve(async (req) => {
  console.log('[exercises] Function invoked!', new Date().toISOString());
  console.log(`[exercises] Request method: ${req.method}, URL: ${req.url}`);
  // OPTIONSリクエストに対するCORSプリフライト応答
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Supabaseクライアントの初期化
    const supabaseClient = createClient(
      // Environment variables are automatically populated by Supabase CLI/platform
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // 通常はservice_roleキーを使用
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 認証されたユーザーを取得
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ message: '認証されていません' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;


    // --- ここから homeController.getHomeScreenData のロジックを移植 ---

    // 今日のワークアウト情報を取得
    const { data: userTrainingPlan, error: planError } = await supabaseClient
      .from('user_training_plans')
      .select('*')
      .eq('user_id', userId)
      .single();

    // planError のチェック (Supabaseのエラーは throw されるか、dataがnullになる)
    // 404 Not Found は Supabase クライアントが適切に処理してくれる場合がある
    // エラーハンドリングは要件に応じて調整
     if (!userTrainingPlan) {
       // プランが見つからない場合のエラー処理（またはデフォルト値の設定）
       console.error('Training plan not found for user:', userId, planError);
       // 適切なエラーレスポンスを返すか、デフォルトの HomeScreenData を返す
       // return new Response(JSON.stringify({ message: 'トレーニングプランが見つかりません' }), { ... });
       // ここでは例として空のデータを返す（要件に応じて変更）
        return new Response(JSON.stringify(generateEmptyHomeScreenData(userId)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // または 404 など状況に応じて
        });
     }


    // 曜日または日付から今日のトレーニングを決定
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 日曜, 1: 月曜, ...
    const dayNumber = (dayOfWeek === 0) ? 7 : dayOfWeek; // 日曜を7とする

    const { data: todayTraining, error: trainingError } = await supabaseClient
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

    // 今日のトレーニングがない場合は休息日とする
    if (trainingError || !todayTraining) {
      console.log('No training found for today, assuming rest day for user:', userId);
      return new Response(JSON.stringify(generateRestDayResponse(userId, userTrainingPlan.name)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // トレーニング種目から今日のワークアウト情報を生成
    const exercises = todayTraining.user_day_exercises.map((exercise: UserDayExerciseItem) => ({
      name: exercise.exercise.name,
      sets: exercise.set_count,
      reps: `${exercise.rep_min}-${exercise.rep_max}`
    }));

    // 週間進捗情報を取得 (ロジックはExpress版と同じ)
    const weekStart = new Date();
    weekStart.setDate(today.getDate() - dayOfWeek); // 週の始まりを日曜日に設定
    weekStart.setHours(0, 0, 0, 0); // 日付の比較のため時間をリセット
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999); // 週の終わり

    const { data: weekSessions, error: sessionsError } = await supabaseClient
      .from('sessions')
      .select('id', { count: 'exact' }) // セッション数をカウントするだけ
      .eq('user_id', userId)
      .gte('start_time', weekStart.toISOString())
      .lte('start_time', weekEnd.toISOString());

    if (sessionsError) {
      console.error('Error fetching weekly sessions:', sessionsError);
      // エラーが発生しても処理を続行する（進捗は0として表示）
    }
    const completedSessions = weekSessions?.length || 0; // Supabase v2では count が data に含まれる場合があるため要確認
    // `sessionsError`があっても`weekSessions`が`null`または`[]`になる想定
    const totalPlannedWorkouts = 5; // これはプランから取得するのがより正確かも

    // 達成情報を取得（最新のベンチプレス最大重量）
    const { data: recentAchievementData, error: achievementError } = await supabaseClient
      .from('session_exercises')
      .select(`
        weight, exercise_name, session:sessions!inner(start_time)
      `)
      .eq('session.user_id', userId) // sessionテーブルのuser_idでフィルタ
      .eq('exercise_name', 'ベンチプレス') // 特定のエクササイズ名
      .order('weight', { ascending: false })
      .order('start_time', { foreignTable: 'session', ascending: false }) // 最新のセッションから
      .limit(1)
      .maybeSingle(); // データがない場合もエラーにしない

     if (achievementError) {
       console.error('Error fetching recent achievement:', achievementError);
       // エラーが発生しても処理を続行
     }

    const recentAchievement = recentAchievementData ? {
        title: `${recentAchievementData.exercise_name}自己ベスト更新`,
        date: formatDate(new Date(recentAchievementData.session.start_time)),
        value: `${recentAchievementData.weight}kg`
      } : {
        title: "まだ達成記録がありません",
        date: "今日",
        value: ""
      };


    // ホーム画面データを生成
    const homeData: HomeScreenData = {
      todayWorkout: {
        title: todayTraining.title,
        day: `Day ${todayTraining.day_number}`,
        program: userTrainingPlan.name,
        exercises: exercises,
        duration: `${todayTraining.estimated_duration || '-'}分` // duration がない場合も考慮
      },
      weeklyProgress: {
        completed: completedSessions,
        total: totalPlannedWorkouts, // 週のトレーニング目標日数
        percentage: totalPlannedWorkouts > 0 ? (completedSessions / totalPlannedWorkouts) * 100 : 0
      },
      recentAchievement: recentAchievement,
      trainingTip: { // トレーニングチップは固定またはDBから取得
        content: "胸筋トレーニングでは、ベンチプレスの際に肩甲骨を寄せることで、より効果的に大胸筋を刺激することができます。",
        category: "technique"
      }
    };

    // --- 移植ここまで ---


    // JSONレスポンスを返す
    return new Response(JSON.stringify(homeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ message: 'サーバーエラーが発生しました' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// --- ヘルパー関数 ---

// 休息日用のレスポンスを生成
// 引数に programName を追加して、プラン名を動的に設定できるように変更
const generateRestDayResponse = (userId: string, programName: string = "あなたのプログラム"): HomeScreenData => {
  // 休息日でも週間進捗は計算する必要があるかもしれない (ここでは省略)
  return {
    todayWorkout: {
      title: "休息日",
      day: "Rest Day",
      program: programName, // プラン名を使用
      exercises: [],
      duration: "0分"
    },
    weeklyProgress: { // 休息日でも進捗は表示したいので、Express版とは変える
      completed: 0, // ここは別途計算が必要
      total: 5,     // ここもプランから取得したい
      percentage: 0 // ここも別途計算が必要
    },
    recentAchievement: { // 休息日でも表示
      title: "まだ達成記録がありません", // ここも別途取得が必要
      date: "今日",
      value: ""
    },
    trainingTip: {
      content: "休息日は筋肉の回復と成長に重要です。軽いストレッチやウォーキングがおすすめです。",
      category: "recovery"
    }
  };
};

// トレーニングプランがない場合の空データ
const generateEmptyHomeScreenData = (userId: string): HomeScreenData => {
   return {
     todayWorkout: {
       title: "プラン未設定",
       day: "-",
       program: "プランを設定してください",
       exercises: [],
       duration: "0分"
     },
     weeklyProgress: { completed: 0, total: 0, percentage: 0 },
     recentAchievement: { title: "まだ達成記録がありません", date: "-", value: "" },
     trainingTip: { content: "まずはトレーニングプランを設定しましょう！", category: "setup" }
   };
 };


// 日付をフォーマット (Express版と同じ)
const formatDate = (date: Date): string => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const targetDateStr = date.toDateString();
  const nowDateStr = now.toDateString();
  const yesterdayDateStr = yesterday.toDateString();

  if (targetDateStr === nowDateStr) {
    return "今日";
  } else if (targetDateStr === yesterdayDateStr) {
    return "昨日";
  } else {
    // 日本語ロケールで月/日形式
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  }
}; 