/// <reference types="https://deno.land/x/deno/cli/types/deno.d.ts" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// リクエストボディの型定義 (必要に応じて詳細化)
interface StartSessionBody {
  dayId: string;
}

interface CompleteSessionBody {
  sessionId: string;
}

interface RecordSetBody {
  sessionId: string;
  exerciseId: string; // workoutControllerでは exercise_id だったが、モバイル側と合わせる可能性も
  setNumber: number;
  weight: number;
  reps: number;
  // 必要なら rpe, notes なども追加
}

// ヘルパー関数 (後で workoutController から移植)
async function calculateDuration(supabaseClient: SupabaseClient, sessionId: string): Promise<string | null> {
  const { data: session, error } = await supabaseClient
    .from('sessions')
    .select('start_time')
    .eq('id', sessionId)
    .single();

  if (error || !session || !session.start_time) {
    console.error(`[helper:calculateDuration] Error fetching session ${sessionId} or start_time is null:`, error);
    return null;
  }

  const startTime = new Date(session.start_time);
  const endTime = new Date();
  const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  return `${durationInSeconds} seconds`;
}

async function createSessionSummary(supabaseClient: SupabaseClient, sessionId: string): Promise<void> {
  console.log(`[training-session] Attempting to create summary for session: ${sessionId}`);
  const { data: sessionData, error: sessionError } = await supabaseClient
    .from('sessions')
    .select('user_id, start_time, end_time, duration')
    .eq('id', sessionId)
    .single();

  if (sessionError || !sessionData) {
    console.error(`[helper:createSessionSummary] Could not fetch session ${sessionId} for summary:`, sessionError);
    return;
  }

  const { data: sets, error: setsError } = await supabaseClient
    .from('user_exercise_sets')
    .select('exercise_id, weight, reps, rpe, notes')
    .eq('session_id', sessionId);

  if (setsError) {
    console.error(`[helper:createSessionSummary] Could not fetch sets for session ${sessionId}:`, setsError);
    return;
  }

  if (!sets || sets.length === 0) {
    console.log(`[helper:createSessionSummary] No sets found for session ${sessionId}. Summary not created.`);
    return;
  }

  let totalSets = sets.length;
  let totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
  let totalVolume = sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0);
  let maxWeight = Math.max(...sets.map(set => set.weight || 0));

  const summaryData = {
    session_id: sessionId,
    user_id: sessionData.user_id,
    total_sets: totalSets,
    total_reps: totalReps,
    total_volume: totalVolume,
    max_weight_lifted: maxWeight,
  };

  const { error: summaryInsertError } = await supabaseClient
    .from('session_summaries')
    .insert(summaryData);

  if (summaryInsertError) {
    console.error(`[helper:createSessionSummary] Error inserting session summary for ${sessionId}:`, summaryInsertError);
  }
  console.log(`[training-session] Session summary created/updated for session: ${sessionId}`);
}


serve(async (req) => {
  console.log('[training-session] Function invoked!', new Date().toISOString());
  console.log(`[training-session] Request method: ${req.method}, URL: ${req.url}`);

  if (req.method === 'OPTIONS') {
    console.log('[training-session] Handling OPTIONS request');
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
      console.error('[training-session] Auth error:', userError);
      return new Response(JSON.stringify({ message: '認証されていません' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;
    console.log(`[training-session] Authenticated user: ${userId}`);

    const url = new URL(req.url);
    // 前提: req.url.pathname は /training-session/* のようになる
    const basePath = '/training-session';
    let relevantPath = '';
    if (url.pathname.startsWith(basePath)) {
      relevantPath = url.pathname.substring(basePath.length);
    }
    const pathSegments = relevantPath.split('/').filter(Boolean);
    console.log(`[training-session] Pathname: ${url.pathname}, Relevant path segments: ${JSON.stringify(pathSegments)}`);

    // POST /training-session/start
    if (req.method === 'POST' && pathSegments.length === 1 && pathSegments[0] === 'start') {
      console.log('[training-session] Handling POST /start (startTrainingSession)');
      const body: StartSessionBody = await req.json();
      if (!body.dayId) {
        return new Response(JSON.stringify({ message: 'dayId が必要です' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // セッションを作成
      const { data: newSession, error: sessionError } = await supabaseClient
        .from('sessions')
        .insert({
          user_id: userId, // 認証済みユーザーIDを使用
          start_time: new Date().toISOString(),
          // created_at, updated_at はDBのデフォルトまたはトリガーで設定される想定
        })
        .select()
        .single();

      if (sessionError || !newSession) {
        console.error('[training-session] Error creating session:', sessionError);
        return new Response(JSON.stringify({ message: 'セッションの作成に失敗しました', error: sessionError?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }

      // セッションとトレーニング日を関連付け
      const { error: relationError } = await supabaseClient
        .from('session_training_days')
        .insert({
          session_id: newSession.id,
          training_day_id: body.dayId,
        });

      if (relationError) {
        // ここで作成したセッションをロールバックする処理も考慮できるが、まずはエラーを返す
        console.error('[training-session] Error associating session with training day:', relationError);
        return new Response(JSON.stringify({ message: 'セッションの関連付けに失敗しました', error: relationError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }

      return new Response(JSON.stringify({ message: 'トレーニングセッションを開始しました', session: newSession }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }); // 201 Created がより適切
    }

    // POST /training-session/complete
    else if (req.method === 'POST' && pathSegments.length === 1 && pathSegments[0] === 'complete') {
      console.log('[training-session] Handling POST /complete (completeTrainingSession)');
      const body: CompleteSessionBody = await req.json();
      if (!body.sessionId) {
        return new Response(JSON.stringify({ message: 'sessionId が必要です' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const sessionDuration = await calculateDuration(supabaseClient, body.sessionId);
      if (sessionDuration === null) {
        console.error(`[training-session] Could not calculate duration for session ${body.sessionId}. Session might not exist or start_time is null.`);
        return new Response(JSON.stringify({ message: 'セッション期間の計算に失敗しました。セッションが存在しないか、開始時刻が記録されていません。' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
      }

      const { data: updatedSession, error: updateError } = await supabaseClient
        .from('sessions')
        .update({
          end_time: new Date().toISOString(),
          duration: sessionDuration,
        })
        .eq('id', body.sessionId)
        .select()
        .single();

      if (updateError || !updatedSession) {
        console.error('[training-session] Error completing session:', updateError);
        return new Response(JSON.stringify({ message: 'セッションの完了に失敗しました', error: updateError?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }

      try {
        await createSessionSummary(supabaseClient, body.sessionId);
      } catch (summaryError) {
        console.error('[training-session] Error creating session summary:', summaryError);
      }

      return new Response(JSON.stringify({ message: 'トレーニングセッションを完了しました', session: updatedSession }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // POST /training-session/record
    else if (req.method === 'POST' && pathSegments.length === 1 && pathSegments[0] === 'record') {
      console.log('[training-session] Handling POST /record (recordExerciseSet)');
      const body: RecordSetBody = await req.json();
      
      // バリデーション (簡易)
      if (!body.sessionId || !body.exerciseId || typeof body.setNumber !== 'number' || typeof body.weight !== 'number' || typeof body.reps !== 'number') {
        return new Response(JSON.stringify({ message: '必須パラメータが不足しているか、型が正しくありません。' }), { 
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      const { data: recordedSet, error: setError } = await supabaseClient
        .from('user_exercise_sets') // テーブル名が正しいか確認
        .insert({
          session_id: body.sessionId,
          exercise_id: body.exerciseId, // カラム名が exerciseId か exercise_id か確認
          set_number: body.setNumber,
          weight: body.weight,
          reps: body.reps,
          user_id: userId, // 認証ユーザーIDも記録
          // rpe: body.rpe, // 必要なら追加
          // notes: body.notes, // 必要なら追加
        })
        .select()
        .single(); // 1件の挿入なのでsingle()でも良いが、複数件insertの場合は不要

      if (setError || !recordedSet) {
        console.error('[training-session] Error recording exercise set:', setError);
        return new Response(JSON.stringify({ message: 'エクササイズセットの記録に失敗しました', error: setError?.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }

      return new Response(JSON.stringify({ message: 'エクササイズセットを記録しました', set: recordedSet }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 });
    }

    else {
      console.warn('[training-session] Unknown route or method');
      return new Response(JSON.stringify({ message: 'エンドポイントが見つかりません' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
    }

  } catch (error) {
    console.error('[training-session] Unhandled error:', error);
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    // リクエストボディのパースエラーなども考慮
    if (error instanceof SyntaxError) {
        return new Response(JSON.stringify({ message: 'リクエストボディの形式が正しくありません。', error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }
    return new Response(JSON.stringify({ message: 'サーバーエラーが発生しました', error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
}); 