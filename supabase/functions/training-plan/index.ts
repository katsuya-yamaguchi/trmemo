/// <reference types="https://deno.land/x/deno/cli/types/deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Hello from Training Plan!");

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
  // CORSヘッダーの処理
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    console.log("URL pathname:", url.pathname);
    console.log("Path segments:", pathSegments);

    // パス解析の改善
    let command = null;
    let planId = null;
    let dayId = null;

    if (pathSegments.length >= 2 && pathSegments[0] === 'training-plan') {
      if (pathSegments[1] === 'create') {
        command = 'create';
      } else if (pathSegments[1] === 'day' && pathSegments.length >= 3) {
        // /training-plan/day/{dayId} のパターン
        dayId = pathSegments[2];
        command = 'day';
      } else if (pathSegments[1].match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // UUID形式の場合はplanId
        planId = pathSegments[1];
      }
    }
    
    console.log("Parsed command:", command, "planId:", planId, "dayId:", dayId);

    // Supabaseクライアントの作成
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // プラン作成
    if (req.method === "POST" && command === "create") {
      const { name, trainingDays } = await req.json();

      // 認証ユーザー取得
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("認証が必要です");

      // プラン作成（実際のスキーマに合わせる）
      const { data: plan, error: planError } = await supabaseClient
        .from("training_plans")
        .insert({
          user_id: user.id,
          plan_text: name, // nameではなくplan_textを使用
          // created_at はDBのデフォルト値に任せる
        })
        .select()
        .single();

      if (planError) throw planError;

      // user_training_plansテーブルにも作成
      const { data: userPlan, error: userPlanError } = await supabaseClient
        .from("user_training_plans")
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          name: name,
          base_plan_id: plan.id,
          start_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (userPlanError) throw userPlanError;

      // トレーニング日の作成（user_training_plansのIDを使用）
      for (const day of trainingDays) {
        const { data: trainingDay, error: dayError } = await supabaseClient
          .from("user_training_days")
          .insert({
            id: crypto.randomUUID(),
            user_training_plan_id: userPlan.id,
            day_number: day.day_number,
            title: day.title,
            estimated_duration: day.estimated_duration,
          })
          .select()
          .single();

        if (dayError) throw dayError;

        // 種目の作成
        for (const exercise of day.exercises) {
          const { error: exerciseError } = await supabaseClient
            .from("user_day_exercises")
            .insert({
              id: crypto.randomUUID(),
              user_training_day_id: trainingDay.id,
              exercise_id: exercise.id,
              set_count: exercise.sets,
              rep_min: parseInt(exercise.reps.split('-')[0]) || 1,
              rep_max: parseInt(exercise.reps.split('-')[1]) || parseInt(exercise.reps) || 1,
            });

          if (exerciseError) throw exerciseError;
        }
      }

      return new Response(JSON.stringify({ success: true, plan_id: userPlan.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      });
    }

    // プラン更新
    else if (req.method === "PUT" && planId) {
      const { name, trainingDays } = await req.json();

      // プラン更新（user_training_plansテーブルを使用）
      const { error: planError } = await supabaseClient
        .from("user_training_plans")
        .update({ name })
        .eq("id", planId);

      if (planError) throw planError;

      // 既存のトレーニング日を取得
      const { data: existingDays, error: daysError } = await supabaseClient
        .from("user_training_days")
        .select("id, day_number")
        .eq("user_training_plan_id", planId);

      if (daysError) throw daysError;

      // トレーニング日の更新
      for (const day of trainingDays) {
        const existingDay = existingDays?.find(d => d.day_number === day.day_number);

        if (existingDay) {
          // 既存の日を更新
          const { error: dayError } = await supabaseClient
            .from("user_training_days")
            .update({
              title: day.title,
              estimated_duration: day.estimated_duration,
            })
            .eq("id", existingDay.id);

          if (dayError) throw dayError;

          // 既存の種目を削除
          const { error: deleteExercisesError } = await supabaseClient
            .from("user_day_exercises")
            .delete()
            .eq("user_training_day_id", existingDay.id);

          if (deleteExercisesError) throw deleteExercisesError;

          // 新しい種目を作成
          for (const exercise of day.exercises) {
            const { error: exerciseError } = await supabaseClient
              .from("user_day_exercises")
              .insert({
                id: crypto.randomUUID(),
                user_training_day_id: existingDay.id,
                exercise_id: exercise.id,
                set_count: exercise.sets,
                rep_min: parseInt(exercise.reps.split('-')[0]) || 1,
                rep_max: parseInt(exercise.reps.split('-')[1]) || parseInt(exercise.reps) || 1,
              });

            if (exerciseError) throw exerciseError;
          }
        } else {
          // 新しい日を作成
          const { data: newDay, error: newDayError } = await supabaseClient
            .from("user_training_days")
            .insert({
              id: crypto.randomUUID(),
              user_training_plan_id: planId,
              day_number: day.day_number,
              title: day.title,
              estimated_duration: day.estimated_duration,
            })
            .select()
            .single();

          if (newDayError) throw newDayError;

          // 種目を作成
          for (const exercise of day.exercises) {
            const { error: exerciseError } = await supabaseClient
              .from("user_day_exercises")
              .insert({
                id: crypto.randomUUID(),
                user_training_day_id: newDay.id,
                exercise_id: exercise.id,
                set_count: exercise.sets,
                rep_min: parseInt(exercise.reps.split('-')[0]) || 1,
                rep_max: parseInt(exercise.reps.split('-')[1]) || parseInt(exercise.reps) || 1,
              });

            if (exerciseError) throw exerciseError;
          }
        }
      }

      // 不要な日を削除
      const dayNumbersToKeep = trainingDays.map(d => d.day_number);
      if (dayNumbersToKeep.length > 0) {
        const { error: deleteDaysError } = await supabaseClient
          .from("user_training_days")
          .delete()
          .eq("user_training_plan_id", planId)
          .not("day_number", "in", `(${dayNumbersToKeep.join(",")})`);
  
        if (deleteDaysError) throw deleteDaysError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 特定の日のトレーニング内容を更新
    else if (req.method === "PUT" && command === "day" && dayId) {
      const { title, estimated_duration, exercises } = await req.json();

      // 認証ユーザー取得
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("認証が必要です");

      // 日の基本情報を更新
      const { error: dayError } = await supabaseClient
        .from("user_training_days")
        .update({
          title: title,
          estimated_duration: estimated_duration,
        })
        .eq("id", dayId);

      if (dayError) throw dayError;

      // 既存の種目を削除
      const { error: deleteExercisesError } = await supabaseClient
        .from("user_day_exercises")
        .delete()
        .eq("user_training_day_id", dayId);

      if (deleteExercisesError) throw deleteExercisesError;

      // 新しい種目を作成
      for (const exercise of exercises) {
        let exerciseId = exercise.id;
        
        // 種目IDが一時的なIDまたは存在しない場合、種目名で検索
        if (!exerciseId || exerciseId.startsWith('temp-')) {
          const { data: existingExercise, error: searchError } = await supabaseClient
            .from("exercises")
            .select("id")
            .eq("name", exercise.name)
            .limit(1)
            .maybeSingle();

          if (searchError) {
            console.error('種目検索エラー:', searchError);
          }

          if (existingExercise) {
            exerciseId = existingExercise.id;
          } else {
            // 新しい種目を作成
            const { data: newExercise, error: createError } = await supabaseClient
              .from("exercises")
              .insert({
                id: crypto.randomUUID(),
                name: exercise.name,
                type: 'other', // デフォルトタイプ
                description: `ユーザーが追加した種目: ${exercise.name}`,
                target_muscles: ['その他'],
                difficulty: 'beginner',
                equipment: 'other'
              })
              .select("id")
              .single();

            if (createError) {
              console.error('種目作成エラー:', createError);
              throw createError;
            }

            exerciseId = newExercise.id;
          }
        }

        // repsの解析を改善
        let rep_min, rep_max;
        if (typeof exercise.reps === 'string' && exercise.reps.includes('-')) {
          // 範囲形式（例：8-12）
          const repsParts = exercise.reps.split('-');
          rep_min = parseInt(repsParts[0]) || 1;
          rep_max = parseInt(repsParts[1]) || rep_min;
        } else {
          // 数値のみの場合
          const repsValue = parseInt(exercise.reps) || 8;
          rep_min = repsValue;
          rep_max = repsValue;
        }

        const { error: exerciseError } = await supabaseClient
          .from("user_day_exercises")
          .insert({
            id: crypto.randomUUID(),
            user_training_day_id: dayId,
            exercise_id: exerciseId,
            set_count: exercise.sets,
            rep_min: rep_min,
            rep_max: rep_max,
          });

        if (exerciseError) throw exerciseError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // プラン削除
    else if (req.method === "DELETE" && planId) {
      const { error } = await supabaseClient
        .from("user_training_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // プラン取得
    else if (req.method === "GET" && planId) {
      // プラン情報を取得
      const { data: plan, error: planError } = await supabaseClient
        .from("user_training_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError) throw planError;

      // トレーニング日を取得
      const { data: days, error: daysError } = await supabaseClient
        .from("user_training_days")
        .select(`
          id,
          day_number,
          title,
          estimated_duration,
          user_day_exercises ( 
            id,
            exercise_id,
            set_count,
            rep_min,
            rep_max,
            exercises ( 
              id,
              name,
              type,
              image_url,
              description,
              target_muscles,
              difficulty,
              equipment
            )
          )
        `)
        .eq("user_training_plan_id", planId)
        .order("day_number");

      if (daysError) throw daysError;

      // レスポンスの整形
      const response = {
        ...plan,
        trainingDays: days?.map(day => ({
          id: day.id,
          day_number: day.day_number,
          title: day.title,
          estimated_duration: day.estimated_duration,
          exercises: day.user_day_exercises.map(ex => ({
            id: ex.exercises.id,
            name: ex.exercises.name,
            type: ex.exercises.type,
            image_url: ex.exercises.image_url,
            description: ex.exercises.description,
            target_muscles: ex.exercises.target_muscles,
            difficulty: ex.exercises.difficulty,
            equipment: ex.exercises.equipment,
            sets: ex.set_count,
            reps: `${ex.rep_min}-${ex.rep_max}`,
            default_weight: null, // user_day_exercisesにはdefault_weightがない
          })),
        })),
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    // 特定ユーザーの全プラン取得 (planId が指定されていない場合)
    else if (req.method === "GET" && !planId) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("認証が必要です");

      const { data: plans, error: plansError } = await supabaseClient
        .from("user_training_plans")
        .select("id, name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (plansError) throw plansError;

      return new Response(JSON.stringify(plans || []), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 不正なエンドポイント
    else {
      return new Response(
        JSON.stringify({ error: "Invalid endpoint or method" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }
  } catch (error) {
    console.error("Error in training-plan function:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 