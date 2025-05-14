/// <reference types="https://deno.land/x/deno/cli/types/deno.d.ts" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface UserDayExerciseItem {
  exercise: {
    id: string; // Exercise IDも追加
    name: string;
  };
  set_count: number;
  rep_min: number;
  rep_max: number;
}

interface FormattedExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
}

interface TrainingDay {
  id: string;
  day_number: number;
  title: string;
  estimated_duration: number | null;
  exercises: FormattedExercise[];
}

interface TrainingPlanResponse {
  id: string;
  name: string;
  startDate?: string; // オプショナルに変更
  trainingDays: TrainingDay[];
}

interface DayWorkoutResponse extends TrainingDay { // TrainingDayを拡張
  // user_day_exercises の他の情報も必要に応じて追加
}


serve(async (req) => {
  console.log('[training-plan] Function invoked!', new Date().toISOString());
  console.log(`[training-plan] Request method: ${req.method}, URL: ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log('[training-plan] Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('[training-plan] Auth error:', userError);
      return new Response(JSON.stringify({ message: '認証されていません' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;
    console.log(`[training-plan] Authenticated user: ${userId}`);

    const url = new URL(req.url);
    // 前提: req.url.pathname は /training-plan や /training-plan/day/some-id のようになる
    //       ここから /training-plan を取り除き、それ以降のセグメントで判断する
    const basePath = '/training-plan'; // Functionのベースパス
    let relevantPath = '';
    if (url.pathname.startsWith(basePath)) {
      relevantPath = url.pathname.substring(basePath.length);
    }
    const pathSegments = relevantPath.split('/').filter(Boolean);
    console.log(`[training-plan] Assuming no /functions/v1/ in req.url. Pathname: ${url.pathname}, Relevant path segments: ${JSON.stringify(pathSegments)}`);

    // --- ここに getUserTrainingPlan と getDayWorkout のロジックを移植 ---

    // 1. GET /training-plan (ユーザーのトレーニングプラン全体を取得)
    if (req.method === 'GET' && pathSegments.length === 0) {
      console.log('[training-plan] Handling GET /training-plan (getUserTrainingPlan)');
      
      // ユーザーの最新（またはアクティブな）トレーニングプランを取得
      const { data: userPlan, error: planError } = await supabaseClient
        .from('user_training_plans')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (planError) {
        console.error('[training-plan] Error fetching user training plan:', planError);
        return new Response(JSON.stringify({ message: 'トレーニングプランの取得に失敗しました', error: planError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      if (!userPlan) {
        return new Response(JSON.stringify({ message: '有効なトレーニングプランが見つかりません' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404, 
        });
      }

      // プランに紐づくトレーニング日と、各日のエクササイズを取得
      const { data: trainingDaysWithExercises, error: daysError } = await supabaseClient
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
        .order('day_number', { ascending: true });

      if (daysError) {
        console.error('[training-plan] Error fetching training days:', daysError);
        return new Response(JSON.stringify({ message: 'トレーニング日の取得に失敗しました', error: daysError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      const formattedTrainingDays: TrainingDay[] = trainingDaysWithExercises ? trainingDaysWithExercises.map((day: any) => ({
        id: day.id,
        day_number: day.day_number,
        title: day.title,
        estimated_duration: day.estimated_duration,
        exercises: day.user_day_exercises.map((exItem: UserDayExerciseItem) => ({ // 型を UserDayExerciseItem に
          id: exItem.exercise.id,
          name: exItem.exercise.name,
          sets: exItem.set_count,
          reps: `${exItem.rep_min}-${exItem.rep_max}`,
        })),
      })) : [];

      const responseData: TrainingPlanResponse = {
        id: userPlan.id,
        name: userPlan.name,
        startDate: userPlan.start_date, // `user_training_plans` に start_date がある前提
        trainingDays: formattedTrainingDays,
      };

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. GET /training-plan/day/:dayId (特定日のトレーニング詳細を取得)
    // pathSegments は ["day", "dayId"] になる
    else if (req.method === 'GET' && pathSegments.length === 2 && pathSegments[0] === 'day' && pathSegments[1]) {
      const dayId = pathSegments[1];
      console.log(`[training-plan] Handling GET /training-plan/day/${dayId} (getDayWorkout)`);
      
      const { data: dayWorkoutData, error: dayWorkoutError } = await supabaseClient
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
        .eq('id', dayId)
        .single();

      if (dayWorkoutError) {
        console.error(`[training-plan] Error fetching day workout for ${dayId}:`, dayWorkoutError);
        return new Response(JSON.stringify({ message: '指定された日のトレーニングが見つかりません', error: dayWorkoutError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          // 存在しない場合は 404 Not Found が適切
          status: dayWorkoutError.code === 'PGRST116' ? 404 : 500, 
        });
      }

      if (!dayWorkoutData) { // double check, single() should error if not found with PGRST116
        return new Response(JSON.stringify({ message: '指定された日のトレーニングが見つかりません' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      // user_day_exercises を整形 (getUserTrainingPlan と同様のロジック)
      const formattedExercises: FormattedExercise[] = dayWorkoutData.user_day_exercises ? dayWorkoutData.user_day_exercises.map((exItem: UserDayExerciseItem) => ({
        id: exItem.exercise.id,
        name: exItem.exercise.name,
        sets: exItem.set_count,
        reps: `${exItem.rep_min}-${exItem.rep_max}`,
      })) : [];
      
      const responseData: DayWorkoutResponse = {
        id: dayWorkoutData.id,
        day_number: dayWorkoutData.day_number,
        title: dayWorkoutData.title,
        estimated_duration: dayWorkoutData.estimated_duration,
        exercises: formattedExercises,
      };

      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- 移植ここまで ---

    else {
      console.warn('[training-plan] Unknown route or method');
      return new Response(JSON.stringify({ message: 'エンドポイントが見つかりません' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

  } catch (error) {
    console.error('[training-plan] Unhandled error:', error);
    return new Response(JSON.stringify({ message: 'サーバーエラーが発生しました', error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 