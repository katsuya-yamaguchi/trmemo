import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

// Supabaseクライアントの初期化 (環境変数から取得)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);

// ユーザーのトレーニング履歴を取得する関数
async function getWorkoutHistory(req: Request) {
  try {
    // 認証ヘッダーからユーザー情報を取得
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "認証ヘッダーがありません" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("User retrieval error:", userError);
      return new Response(JSON.stringify({ message: "認証されていません" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    // クエリパラメータからページネーション情報を取得 (デフォルト値設定)
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "5", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);


    // 1. ユーザーのトレーニングセッションを新しい順に取得 (ページネーション適用)
    const { data: sessions, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, start_time, duration, summary") // summary も取得するように変更
      .eq("user_id", userId)
      .order("start_time", { ascending: false }) // 新しい順
      .range(offset, offset + limit - 1); // ページネーション

    if (sessionsError) {
      console.error("Error fetching workout history (sessions):", sessionsError);
      return new Response(
        JSON.stringify({ message: "トレーニング履歴の取得に失敗しました(セッション)", error: sessionsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify([]), { // 履歴がない場合は空配列を返す
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. 各セッションの種目数を取得 (session_summariesテーブルから)
    const sessionIds = sessions.map(s => s.id);
    const { data: sessionSummaries, error: summariesError } = await supabase
      .from("session_summaries")
      .select("session_id, total_distinct_exercises")
      .in("session_id", sessionIds);

    if (summariesError) {
        console.error("Error fetching session summaries:", summariesError);
        // エラーでも処理を継続するが、exerciseCount は 0 になる
    }
    
    // session_id をキーとした種目数のマップを作成
    const exerciseCountMap = new Map<string, number>();
    if (sessionSummaries) {
        sessionSummaries.forEach(summary => {
            exerciseCountMap.set(summary.session_id, summary.total_distinct_exercises || 0);
        });
    }


    // 3. セッションごとにデータを整形してレスポンスを作成
    const formattedHistory = sessions.map(session => {
      const exerciseCount = exerciseCountMap.get(session.id) || 0; // マップから取得、なければ0

      // ハイライトの準備 (session.summary があればそれを使う)
      let highlights = "記録なし";
      if (session.summary && session.summary.top_exercise) {
          const topEx = session.summary.top_exercise;
          if (topEx.weight && topEx.reps) {
            highlights = `${topEx.exercise_name} ${topEx.weight}kg x ${topEx.reps}回`;
          } else if (topEx.reps) { //自重など
            highlights = `${topEx.exercise_name} ${topEx.reps}回`;
          } else {
            highlights = topEx.exercise_name || "記録なし";
          }
      } else {
          // summaryがない、またはtop_exerciseがない場合のフォールバック (ほとんど起こらないはず)
          // 以前のロジックを参考に session_exercises から取得することも考えられるが、
          // completeTrainingSession で summary が作られる前提なので、ここでは簡略化
      }


      return {
        id: session.id,
        date: formatDateForHistory(new Date(session.start_time)),
        title: `トレーニング (${formatDuration(session.duration)})`,
        highlights: highlights,
        exercises: exerciseCount,
      };
    });

    return new Response(JSON.stringify(formattedHistory), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error in getWorkoutHistory:", error);
    return new Response(JSON.stringify({ message: "サーバーエラーが発生しました" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// 日付を 'YYYY/MM/DD' 形式にフォーマットする関数
function formatDateForHistory(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}/${month}/${day}`;
}

// Interval 型の duration を 'XX分' 形式にフォーマットする関数
function formatDuration(duration: any): string {
  if (!duration) return "記録なし";
  
  let totalMinutes = 0;
  if (typeof duration === "object" && duration !== null) {
    // PostgreSQL Interval 型の場合: { days: D, hours: H, minutes: M, seconds: S, milliseconds: MS }
    // または { years, months, days, hours, minutes, seconds, milliseconds }
    // Supabase から返る Interval は { minutes: M, seconds: S, milliseconds: MS } のような形のことが多い
    totalMinutes = (duration.days || 0) * 24 * 60 +
                   (duration.hours || 0) * 60 +
                   (duration.minutes || 0) +
                   Math.round((duration.seconds || 0) / 60);
  } else if (typeof duration === "string") {
    // 'HH:MM:SS' や 'PT1H10M' のようなISO 8601 duration string などのパース
    // 例: '01:10:30' (1時間10分30秒)
    const parts = duration.split(':');
    if (parts.length === 3) {
      totalMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + Math.round(parseInt(parts[2], 10) / 60);
    } else {
      // より複雑なパースロジックが必要な場合、または特定の文字列形式に依存する場合
      // 簡単な例: "X hours Y minutes Z seconds" のような形式 (旧コードのフォールバックに近い)
      const hoursMatch = duration.match(/(\d+)\s+hours?/);
      const minsMatch = duration.match(/(\d+)\s+mins?/); // minutes or mins
      const secsMatch = duration.match(/(\d+)\s+secs?/); // seconds or secs
      
      let h = 0, m = 0, s = 0;
      if (hoursMatch) h = parseInt(hoursMatch[1], 10);
      if (minsMatch) m = parseInt(minsMatch[1], 10);
      if (secsMatch) s = parseInt(secsMatch[1], 10);
      
      if (h > 0 || m > 0 || s > 0) {
          totalMinutes = h * 60 + m + Math.round(s / 60);
      } else {
          return "記録なし"; // パース失敗
      }
    }
  }
  
  return totalMinutes > 0 ? `${totalMinutes}分` : (totalMinutes === 0 && duration ? '0分' : '記録なし');
}


serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // パスに応じて処理を振り分ける必要があればここで行う
  // 今回は /workout-history へのGETリクエストのみを想定
  return await getWorkoutHistory(req);
}); 