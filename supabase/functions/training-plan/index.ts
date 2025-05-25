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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    // URLとメソッドの解析
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    // パスセグメントの構造を明確化: /functions/v1/training-plan/:planId または /functions/v1/training-plan/create
    const command = pathSegments[pathSegments.length -1]; // 'create' or planId
    const planId = command !== 'create' ? command : null;

    // プラン作成
    if (req.method === "POST" && command === "create") {
      const { name, trainingDays } = await req.json();

      // 認証ユーザー取得
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) throw new Error("認証が必要です");

      // プラン作成
      const { data: plan, error: planError } = await supabaseClient
        .from("user_training_plans") // 修正: テーブル名
        .insert({
          user_id: user.id,
          name,
          // created_at はDBのデフォルト値に任せる
        })
        .select()
        .single();

      if (planError) throw planError;

      // トレーニング日の作成
      for (const day of trainingDays) {
        const { data: trainingDay, error: dayError } = await supabaseClient
          .from("user_training_days") // 修正: テーブル名
          .insert({
            user_training_plan_id: plan.id, // 修正: カラム名
            day_number: day.day_number,
            title: day.title,
            estimated_duration: day.estimated_duration,
            // created_at はDBのデフォルト値に任せる
          })
          .select()
          .single();

        if (dayError) throw dayError;

        // 種目の作成
        for (const exercise of day.exercises) {
          const { error: exerciseError } = await supabaseClient
            .from("user_day_exercises") // 修正: テーブル名
            .insert({
              user_training_day_id: trainingDay.id, // 修正: カラム名
              exercise_id: exercise.id, // exercise.id が exercises テーブルのIDであることを想定
              sets: exercise.sets,
              reps: exercise.reps,
              default_weight: exercise.default_weight,
              // created_at はDBのデフォルト値に任せる
            });

          if (exerciseError) throw exerciseError;
        }
      }

      return new Response(JSON.stringify({ success: true, plan_id: plan.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201, // 作成成功なので201 Created
      });
    }

    // プラン更新
    else if (req.method === "PUT" && planId) {
      const { name, trainingDays } = await req.json();

      // プラン更新
      const { error: planError } = await supabaseClient
        .from("user_training_plans") // 修正: テーブル名
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", planId);

      if (planError) throw planError;

      // 既存のトレーニング日を取得
      const { data: existingDays, error: daysError } = await supabaseClient
        .from("user_training_days") // 修正: テーブル名
        .select("id, day_number")
        .eq("user_training_plan_id", planId); // 修正: カラム名

      if (daysError) throw daysError;

      // トレーニング日の更新
      for (const day of trainingDays) {
        const existingDay = existingDays?.find(d => d.day_number === day.day_number);

        if (existingDay) {
          // 既存の日を更新
          const { error: dayError } = await supabaseClient
            .from("user_training_days") // 修正: テーブル名
            .update({
              title: day.title,
              estimated_duration: day.estimated_duration,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingDay.id);

          if (dayError) throw dayError;

          // 既存の種目を削除
          const { error: deleteExercisesError } = await supabaseClient
            .from("user_day_exercises") // 修正: テーブル名
            .delete()
            .eq("user_training_day_id", existingDay.id); // 修正: カラム名

          if (deleteExercisesError) throw deleteExercisesError;

          // 新しい種目を作成
          for (const exercise of day.exercises) {
            const { error: exerciseError } = await supabaseClient
              .from("user_day_exercises") // 修正: テーブル名
              .insert({
                user_training_day_id: existingDay.id, // 修正: カラム名
                exercise_id: exercise.id,
                sets: exercise.sets,
                reps: exercise.reps,
                default_weight: exercise.default_weight,
                // created_at はDBのデフォルト値に任せる
              });

            if (exerciseError) throw exerciseError;
          }
        } else {
          // 新しい日を作成
          const { data: newDay, error: newDayError } = await supabaseClient
            .from("user_training_days") // 修正: テーブル名
            .insert({
              user_training_plan_id: planId, // 修正: カラム名
              day_number: day.day_number,
              title: day.title,
              estimated_duration: day.estimated_duration,
              // created_at はDBのデフォルト値に任せる
            })
            .select()
            .single();

          if (newDayError) throw newDayError;

          // 種目を作成
          for (const exercise of day.exercises) {
            const { error: exerciseError } = await supabaseClient
              .from("user_day_exercises") // 修正: テーブル名
              .insert({
                user_training_day_id: newDay.id, // 修正: カラム名
                exercise_id: exercise.id,
                sets: exercise.sets,
                reps: exercise.reps,
                default_weight: exercise.default_weight,
                // created_at はDBのデフォルト値に任せる
              });

            if (exerciseError) throw exerciseError;
          }
        }
      }

      // 不要な日を削除
      const dayNumbersToKeep = trainingDays.map(d => d.day_number);
      if (dayNumbersToKeep.length > 0) { // 削除対象の日がない場合にエラーになるのを防ぐ
        const { error: deleteDaysError } = await supabaseClient
          .from("user_training_days") // 修正: テーブル名
          .delete()
          .eq("user_training_plan_id", planId) // 修正: カラム名
          .not("day_number", "in", `(${dayNumbersToKeep.join(",")})`);
  
        if (deleteDaysError) throw deleteDaysError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // プラン削除
    else if (req.method === "DELETE" && planId) {
      const { error } = await supabaseClient
        .from("user_training_plans") // 修正: テーブル名
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
        .from("user_training_plans") // 修正: テーブル名
        .select("*")
        .eq("id", planId)
        .single();

      if (planError) throw planError;

      // トレーニング日を取得
      const { data: days, error: daysError } = await supabaseClient
        .from("user_training_days") // 修正: テーブル名
        .select(`
          id,
          day_number,
          title,
          estimated_duration,
          user_day_exercises ( 
            id,
            exercise_id,
            sets,
            reps,
            default_weight,
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
        .eq("user_training_plan_id", planId) // 修正: カラム名
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
            id: ex.exercises.id, // exercises テーブルの情報を展開
            name: ex.exercises.name,
            type: ex.exercises.type,
            image_url: ex.exercises.image_url,
            description: ex.exercises.description,
            target_muscles: ex.exercises.target_muscles,
            difficulty: ex.exercises.difficulty,
            equipment: ex.exercises.equipment,
            sets: ex.sets, // user_day_exercises の情報
            reps: ex.reps,
            default_weight: ex.default_weight,
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
        .select("id, name, updated_at") // 必要な情報のみ取得
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

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