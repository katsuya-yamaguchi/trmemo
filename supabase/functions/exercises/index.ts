/// <reference types="https://deno.land/x/deno/cli/types/deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// --- ヘルパー関数 (workoutController.ts から移植) ---
// カテゴリマッピング（元のロジックをそのまま使用）
function mapMuscleGroupToCategory(muscleGroup: string | null): string {
  if (!muscleGroup) return 'その他';
  const lowerMuscleGroup = muscleGroup.toLowerCase();
  if (lowerMuscleGroup.includes('胸')) return '胸';
  if (lowerMuscleGroup.includes('背中')) return '背中';
  if (lowerMuscleGroup.includes('脚') || lowerMuscleGroup.includes('尻')) return '脚';
  if (lowerMuscleGroup.includes('肩')) return '肩';
  if (lowerMuscleGroup.includes('腕') || lowerMuscleGroup.includes('二頭') || lowerMuscleGroup.includes('三頭')) return '腕';
  if (lowerMuscleGroup.includes('腹')) return '腹筋';
  return '全身・その他'; // デフォルトカテゴリ
}

// ダミー難易度（元のロジックをそのまま使用）
function assignDummyDifficulty(exerciseName: string): string {
  const hash = exerciseName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const difficulties = ['初級', '中級', '上級'];
  return difficulties[hash % difficulties.length];
}

// ダミーヒント（元のロジックをそのまま使用）
function assignDummyTips(exerciseName: string): string[] {
    const baseTips = [
        "正しいフォームを意識しましょう。",
        "呼吸を止めないように注意してください。",
        "動作はゆっくりとコントロールして行いましょう。",
        "適切な重量を選び、無理のない範囲で行ってください。",
        "インターバルは短めに設定すると効果的です。",
        "ウォームアップとクールダウンを忘れずに行いましょう。"
    ];
    // 名前に基づいて少しだけ変化をつける（例）
    const nameLength = exerciseName.length;
    const startIndex = nameLength % baseTips.length;
    return [
        baseTips[startIndex],
        baseTips[(startIndex + 1) % baseTips.length]
    ];
}

// データベースの種目データをモバイルアプリの形式に変換
function formatExerciseForMobile(dbExercise: any) {
  return {
    id: dbExercise.id,
    name: dbExercise.name,
    type: dbExercise.type,
    imageUrl: dbExercise.image_url || 'https://via.placeholder.com/90x90?text=No+Image',
    description: dbExercise.description || '説明はありません。',
    targetMuscles: dbExercise.target_muscles || [],
    difficulty: dbExercise.difficulty || 'beginner',
    equipment: dbExercise.equipment || [],
    created_at: dbExercise.created_at,
    updated_at: dbExercise.updated_at
  };
}
// --- ヘルパー関数ここまで ---

console.log("Hello from Exercises!");

serve(async (req) => {
  // CORSヘッダーの処理
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // クエリパラメータの取得
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

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

    // クエリの構築
    let query = supabaseClient
      .from("exercises")
      .select("*", { count: "exact" });

    // カテゴリーでフィルタリング
    if (category) {
      query = query.eq("type", category);
    }

    // 検索クエリでフィルタリング
    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    // クエリの実行
    const { data: exercises, count, error } = await query;

    if (error) {
      throw error;
    }

    // データをモバイルアプリの形式に変換
    const formattedExercises = exercises ? exercises.map(formatExerciseForMobile) : [];

    // レスポンスの作成
    const response = {
      exercises: formattedExercises,
      total: count || 0,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);

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