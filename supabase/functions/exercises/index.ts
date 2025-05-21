/// <reference types="https://deno.land/x/deno/cli/types/deno.d.ts" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
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
// --- ヘルパー関数ここまで ---


serve(async (req) => {
  console.log('[exercises] Function invoked!', new Date().toISOString());
  console.log(`[exercises] Request method: ${req.method}, URL: ${req.url}`);

  // CORSプリフライト応答
  if (req.method === 'OPTIONS') {
    console.log('[exercises] Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('[exercises] Entering try block');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // 認証不要のエンドポイントだが、DBアクセスにはキーが必要。
      // Service Role Keyを使うか、Anon Key + RLSを使うか選択。
      // ここでは他のFunctionとの一貫性のためService Role Keyを使用する。
      // publicなデータなので Anon Key + RLS の方がよりセキュア。
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      // global ヘッダーはここでは不要 (ユーザー認証しないため)
    );

    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    console.log(`[exercises] Path segments based on assumption: ${JSON.stringify(pathSegments)}`);

    // パスに基づいて処理を分岐
    // 前提: pathSegments には "functions", "v1" は含まれない
    // 例: /exercises -> ["exercises"]
    // 例: /exercises/some-id -> ["exercises", "some-id"]

    // 1. /exercises/:exerciseId (詳細取得)
    //   pathSegments.length === 2 (例: ["exercises", "exerciseId"])
    //   pathSegments[0] === 'exercises'
    //   pathSegments[1] が exerciseId になる
    if (pathSegments.length === 2 && pathSegments[0] === 'exercises' && pathSegments[1]) {
      const exerciseId = pathSegments[1]; // exerciseId は2番目の要素
      console.log(`Fetching details for exerciseId: ${exerciseId}`);

      // workoutController.getExerciseDetails のロジックを移植
      const { data: exercise, error } = await supabaseClient
        .from('exercises')
        .select('*') // 全カラム取得
        .eq('id', exerciseId)
        .maybeSingle(); // maybeSingleでデータなくてもエラーにしない

      if (error) {
        console.error('Error fetching exercise details:', error);
        return new Response(JSON.stringify({ message: 'エクササイズの詳細取得に失敗しました', error: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      if (!exercise) {
        return new Response(JSON.stringify({ message: '指定されたエクササイズが見つかりません' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

       // ダミーデータを追加（元のロジック）
       const responseData = {
         ...exercise,
         difficulty: assignDummyDifficulty(exercise.name),
         category: mapMuscleGroupToCategory(exercise.muscle_group),
         tips: assignDummyTips(exercise.name),
         instructions: exercise.instructions || "ここに説明文が入ります。", // instructions が null の場合のフォールバック
         precautions: exercise.precautions || "ここに注意点が入ります。", // precautions が null の場合のフォールバック
       };


      return new Response(JSON.stringify(responseData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. /exercises (一覧取得)
    //   pathSegments.length === 1 (例: ["exercises"])
    //   pathSegments[0] === 'exercises'
    else if (pathSegments.length === 1 && pathSegments[0] === 'exercises') {
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      console.log(`Fetching exercise list with category: ${category}, search: ${search}`);

      // workoutController.getExerciseLibrary のロジックを移植
      let query = supabaseClient.from('exercises').select('*'); // まず全件取得

      // 検索クエリがある場合
      if (search) {
        // name カラムと description カラムを検索対象とする (ilikeで部分一致、大文字小文字無視)
        // description が存在しない場合は name のみ
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // カテゴリフィルタ（カテゴリはmuscle_groupからマッピングする必要がある）
      // DB側で直接カテゴリフィルタは難しいため、全件取得後にフィルタリングする
      // または、muscle_group で事前に絞り込む（例: '胸' カテゴリなら muscle_group ilike '%胸%' など）
      // ここでは一旦全件取得して後でフィルタリングする方式を採用（件数が多い場合は非効率）

      const { data: exercises, error } = await query;

      if (error) {
        console.error('Error fetching exercise library:', error);
        return new Response(JSON.stringify({ message: 'エクササイズライブラリの取得に失敗しました', error: error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      // カテゴリでフィルタリング & 整形
      const formattedExercises = exercises
        .map(ex => ({
          id: ex.id,
          name: ex.name,
          description: ex.description || '',
          category: mapMuscleGroupToCategory(ex.muscle_group), // カテゴリマッピング
          muscle_group: ex.muscle_group, // 元のmuscle_groupも残すかはお好みで
          equipment_required: ex.equipment_required || '自体重',
          difficulty: assignDummyDifficulty(ex.name), // ダミー難易度
          // video_url: ex.video_url // 必要なら追加
        }))
        .filter(ex => {
          // カテゴリ指定があればフィルタ
          if (category && category !== 'すべて') { // 'すべて' カテゴリはフィルタしない
             return ex.category === category;
          }
          return true; // カテゴリ指定がなければ全件返す
        });


      return new Response(JSON.stringify(formattedExercises), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. それ以外のパスは 404 Not Found
    else {
      return new Response(JSON.stringify({ message: 'エンドポイントが見つかりません' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

  } catch (error) {
    console.error('Unhandled error in exercises function:', error);
    return new Response(JSON.stringify({ message: 'サーバーエラーが発生しました' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 