import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { Database } from '../../../packages/supabase/database.types.ts'; // types のパスは適宜調整してください

// date-fns から必要な関数をインポート
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
} from 'https://esm.sh/date-fns@2.29.3'; // Deno LandのURLからesm.shに変更

// --- ヘルパー関数のプレースホルダー ---
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

function generateChartLabels(startDate: Date, endDate: Date, period: string): { labels: string[], intervalFormat: (date: Date) => string } {
    let labels: string[] = [];
    let intervalFormatFunction: (date: Date) => string; // 変数名を変更 (format との衝突回避)

    switch (period) {
        case 'week':
            // 週表示: 月, 火, ..., 日
            labels = eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'M/d')); // or 'EEE' for 曜
            intervalFormatFunction = (date: Date) => format(date, 'yyyy-MM-dd');
            break;
        case 'year':
            // 年表示: 1月, 2月, ..., 12月
            labels = eachMonthOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'M月'));
            intervalFormatFunction = (date: Date) => format(date, 'yyyy-MM');
            break;
        case 'month': // default to month
        default:
            // 月表示: 日付
            labels = eachDayOfInterval({ start: startDate, end: endDate }).map(d => format(d, 'd')); // 日付
            intervalFormatFunction = (date: Date) => format(date, 'yyyy-MM-dd');
            break;
    }
    return { labels, intervalFormat: intervalFormatFunction };
}

// データからチャート形式に整形 (平均値 or 最大値)
function formatChartData(
    data: any[],
    labels: string[],
    dateField: string,
    valueField: string,
    useMax: boolean = false // 最大値を使うか、最後の値を使うか
): { labels: string[], datasets: [{ data: number[] }] } {

    const datasetData = labels.map(labelKeyPart => {
        const valuesInInterval = data
            .filter(item => {
                if (!item[dateField]) return false;
                 try {
                    // この部分のロジックは labels の生成方法に依存
                    const itemDate = new Date(item[dateField]);
                    if (labels[0].includes('/')) { // 'M/d'
                        return format(itemDate, 'M/d') === labelKeyPart;
                    } else if (labels[0].includes('月')) { // 'M月'
                        return format(itemDate, 'M月') === labelKeyPart;
                    } else if (!isNaN(parseInt(labels[0]))) { // 'd'
                         return format(itemDate, 'd') === labelKeyPart;
                    }
                    // generateChartLabels のデフォルト（month）が 'd' なので、
                    // 上記で対応できない場合は、より汎用的な比較か、
                    // generateChartLabels側のラベル生成と完全に一致させる必要がある。
                    // 一旦、元のロジックを尊重しつつ、安全のためフォールバックを追加。
                    console.warn(`Unknown label format for filtering: ${labelKeyPart}, label example: ${labels[0]}`);
                    return false;
                 } catch { return false; } // 不正な日付データは無視
            })
            .map(item => item[valueField])
            .filter(value => value !== null && value !== undefined && !isNaN(parseFloat(value as string))); // 数値のみ抽出, undefinedもチェック

        if (valuesInInterval.length === 0) return 0; // データがない期間は0

        if (useMax) {
            return Math.max(...valuesInInterval.map(v => parseFloat(v as string)));
        } else {
            // 最後の記録を採用 (データは日付順にソートされている想定)
            return parseFloat(valuesInInterval[valuesInInterval.length - 1] as string);
        }
    });

    return { labels, datasets: [{ data: datasetData }] };
}

// データから件数チャート形式に整形
function formatCountChartData(
    data: any[],
    labels: string[],
    dateField: string
): { labels: string[], datasets: [{ data: number[] }] } {

     const datasetData = labels.map(labelKeyPart => {
         const countInInterval = data.filter(item => {
             if (!item[dateField]) return false;
              try {
                 const itemDate = new Date(item[dateField]);
                 if (labels[0].includes('/')) { return format(itemDate, 'M/d') === labelKeyPart; }
                 else if (labels[0].includes('月')) { return format(itemDate, 'M月') === labelKeyPart; }
                 else if (!isNaN(parseInt(labels[0]))) { return format(itemDate, 'd') === labelKeyPart; }
                 console.warn(`Unknown label format for counting: ${labelKeyPart}, label example: ${labels[0]}`);
                 return false;
              } catch { return false; }
         }).length; // 件数をカウント
         return countInInterval;
     });

     return { labels, datasets: [{ data: datasetData }] };
}

// --- メインロジック ---
async function getProgressData(req: Request) {
  // OPTIONSリクエストの処理 (CORSプリフライト)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = supabaseAdmin; // supabaseAdmin を使用

    // ユーザー認証 (AuthorizationヘッダーからJWTを検証)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('User authentication error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Invalid token or user not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.id;

    // URLからクエリパラメータを取得
    const url = new URL(req.url);
    const dataType = url.searchParams.get('dataType') || 'weight';
    const period = url.searchParams.get('period') || 'month';

    console.log(`[progress-data] User: ${userId}, DataType: ${dataType}, Period: ${period}`);


    // 期間に基づいて日付範囲を計算
    const { startDate, endDate, previousStartDate, previousEndDate } = calculateDateRange(period);
    const { labels, intervalFormat } = generateChartLabels(startDate, endDate, period);

    let chartData: any = { labels: [], datasets: [{ data: [] }] };
    let stats: any = {};

    // データタイプに応じて処理を分岐
    switch (dataType) {
      case 'weight':
        console.log('[progress-data] Processing weight data...');
        // --- 体重データの処理 ---
        const { data: weightData, error: weightError } = await supabaseClient
          .from('body_stats') // テーブル名は実際の設計に合わせてください
          .select('weight, recorded_at')
          .eq('user_id', userId)
          .gte('recorded_at', startDate.toISOString())
          .lte('recorded_at', endDate.toISOString())
          .order('recorded_at', { ascending: true });

        if (weightError) {
          console.error('Error fetching weight data:', weightError);
          throw new Error(`体重データの取得エラー: ${weightError.message}`);
        }

        chartData = formatChartData(
          weightData || [],
          labels,
          'recorded_at',
          'weight'
        );

        // 統計データの計算 (前期間比など)
        const { data: previousWeightData, error: previousWeightError } = await supabaseClient
          .from('body_stats') // テーブル名は実際の設計に合わせてください
          .select('weight')
          .eq('user_id', userId)
          .gte('recorded_at', previousStartDate.toISOString())
          .lte('recorded_at', previousEndDate.toISOString())
          .order('recorded_at', { ascending: false }) // 最新の記録を取得
          .limit(1);

        if (previousWeightError) {
            console.warn('Could not fetch previous weight data for stats, defaulting to 0 change.', previousWeightError);
        }
        
        const latestWeight = weightData?.[weightData.length - 1]?.weight as number | undefined;
        const previousLatestWeight = previousWeightData?.[0]?.weight as number | undefined;
        let weightChange = 0;
        if (latestWeight !== undefined && previousLatestWeight !== undefined) {
            // toFixed(1) で文字列になるので parseFloat で数値に戻す
            weightChange = parseFloat((latestWeight - previousLatestWeight).toFixed(1));
        }
        stats = { change: weightChange };
        break;

      case 'strength':
        console.log('[progress-data] Processing strength data...');
        // --- 筋力データの処理 (例: ベンチプレスの最大重量) ---
        const targetExercise = 'ベンチプレス'; // 対象とする種目 (将来的にはパラメータ化も検討)

        // 1. ユーザーIDと期間に該当するセッションIDを取得
        const { data: relevantSessions, error: relevantSessionsError } = await supabaseClient
            .from('sessions')
            .select('id')
            .eq('user_id', userId)
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString());

        if (relevantSessionsError) {
            console.error('Error fetching relevant session IDs for strength data:', relevantSessionsError);
            throw new Error(`セッションIDの取得エラー: ${relevantSessionsError.message}`);
        }

        const sessionIds = relevantSessions?.map(s => s.id) || [];

        if (sessionIds.length === 0) {
          console.log('[progress-data] No relevant sessions found for strength data.');
          chartData = { labels: labels, datasets: [{ data: labels.map(() => 0) }] };
          stats = { maxWeights: [{ name: targetExercise, weight: 0 }] };
          break; 
        }

        // 2. 取得したセッションIDリストと種目名で session_exercises をフィルタリング
        const { data: strengthData, error: strengthError } = await supabaseClient
          .from('session_exercises')
          .select('weight, created_at')
          .in('session_id', sessionIds)
          .eq('exercise_name', targetExercise)
          .order('created_at', { ascending: true });

        if (strengthError) {
          console.error('Error fetching strength data (session_exercises):', strengthError);
          throw new Error(`筋力データの取得エラー: ${strengthError.message}`);
        }

        chartData = formatChartData(
          strengthData || [],
          labels,
          // intervalFormat, // 使われなくなった
          'created_at',
          'weight',
          true // useMax = true
        );

        // 統計データの計算 (期間内の自己ベスト)
        const maxWeightRecord = (strengthData || []).reduce(
            (max, current) => (current.weight as number || 0) > (max.weight as number || 0) ? current : max,
            { weight: 0 } // 初期値の型を合わせる
        );
        
        stats = {
            maxWeights: [{
                name: targetExercise,
                weight: (maxWeightRecord.weight as number || 0) // 型アサーションとフォールバック
            }]
        };
        break;

      case 'workouts':
        console.log('[progress-data] Processing workouts data...');
        // --- トレーニング数データの処理 ---
        const { data: workoutCountData, error: workoutCountError } = await supabaseClient
          .from('sessions')
          .select('start_time') // start_time のみでOK
          .eq('user_id', userId)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());

        if (workoutCountError) {
          console.error('Error fetching workout count data (sessions):', workoutCountError);
          throw new Error(`トレーニング数データの取得エラー: ${workoutCountError.message}`);
        }

        chartData = formatCountChartData(
          workoutCountData || [],
          labels,
          // intervalFormat, // 使われなくなった
          'start_time'
        );

        // 統計データの計算 (例: 今週のトレーニング回数 vs 目標)
        // date-fns は既にインポート済み
        const today = new Date();
        const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // 週の始まりを月曜に
        const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
        
        const workoutsThisWeek = (workoutCountData || []).filter(s => {
            if (!s.start_time) return false; // null チェック
            const startTime = new Date(s.start_time);
            return startTime >= thisWeekStart && startTime <= thisWeekEnd;
        }).length;
        
        const weeklyTarget = 5; // 仮の目標値 (将来的にはユーザー設定などから取得も検討)
        stats = { total: workoutsThisWeek, target: weeklyTarget };
        break;

      default:
        console.warn(`[progress-data] Invalid dataType: ${dataType}`);
        return new Response(JSON.stringify({ error: '無効なデータタイプです' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
    }

    // レスポンスを返す
    console.log('[progress-data] Successfully processed data. Returning response.');
    return new Response(JSON.stringify({ chartData, stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Critical error in getProgressData:', error);
    // エラーレスポンスの前に、エラーメッセージが実際に存在するか確認
    const errorMessage = error instanceof Error ? error.message : 'サーバーエラーが発生しました';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}


serve(async (req) => {
  // リクエストパスに基づいて処理を振り分け (今回は /progress のみ)
  // Edge Functionsでは、通常、Function名がパスの一部になるため、
  // Function内のルーティングは、より詳細なパスやメソッドで行うことが多い。
  // 今回は /progress-data/ という Function が呼ばれた時点でこのコードが実行される想定。
  // クエリパラメータで dataType を受け取るので、パスによる分岐は不要。

  // 実際には、Functionが呼び出されるURLは /functions/v1/progress-data になる。
  // req.url をパースして、そこから必要な情報を取得する。

  // TODO: 以前のFunctionのように、パスのセグメントを解析して / 以外のパスに対応する場合は、
  //       そのロジックを追加する。今回は /progress-data (ルート) のみ処理すると仮定。
  // const url = new URL(req.url);
  // const pathSegments = url.pathname.split('/').filter(Boolean);
  // console.log('[progress-data] Request path segments:', pathSegments);

  // 現状、このFunctionは /progress-data という単一のエンドポイントのみを持つ想定
  return getProgressData(req);
});

/*
// date-fns のインポート例 (supabase/functions/_shared/ 以下などに置く場合)
// import { format } from "https://deno.land/x/date_fns/format/index.js";
// import { startOfWeek } from "https://deno.land/x/date_fns/startOfWeek/index.js";
// ... etc.
// ローカルの date-fns モジュールを使う場合は、Denoが解釈できるようにパスを指定する
// (例: import { format } from "../../node_modules/date-fns/esm/format/index.js";)
// ただし、Edge FunctionsのDeno環境ではnpmモジュールを直接インポートできないため、
// CDN経由 (esm.sh, skypackなど) や、Denoのサードパーティモジュール (deno.land/x/) を利用するのが一般的。
// date-fns は deno.land/x/date_fns で利用可能。
*/

/*
型エラーが出る場合の対処:
/// <reference types="https://esm.sh/v111/@supabase/functions-js@2.1.0/dist/src/edge-runtime.d.ts" />
または、
Deno.env.get() など Deno 固有の API で型エラーが出る場合、プロジェクトルートの deno.json (または deno.jsonc) に
以下のような compilerOptions を設定することで解決する場合があります。
{
  "compilerOptions": {
    "types": [
      "https://esm.sh/v111/@supabase/functions-js@2.1.0/dist/src/edge-runtime.d.ts"
    ]
  }
}
*/ 