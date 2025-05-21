import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

interface BodyStat {
  recorded_date: string | Date; // DBからは文字列としてくる想定
  weight: number;
  // body_fat?: number; // 必要であれば
}

interface ChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

// チャート用にデータを整形する関数 (userController.tsから移植)
const formatChartData = (data: BodyStat[], period: string): ChartData => {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [{ data: [] }] };
  }

  // 日付でソート (昇順)
  const sortedData = [...data].sort((a, b) =>
    new Date(a.recorded_date).getTime() - new Date(b.recorded_date).getTime()
  );

  let labels: string[] = [];
  let values: number[] = [];

  if (period === 'week') {
    // 週の場合は各日を表示
    sortedData.forEach(entry => {
      const date = new Date(entry.recorded_date);
      // DenoでのtoLocaleDateStringの挙動を確認、必要であれば調整
      labels.push(date.toLocaleDateString('ja-JP', { weekday: 'short' }));
      values.push(entry.weight);
    });
  } else if (period === 'month') {
    // 月の場合は日を表示 (例: 7/15)
    sortedData.forEach(entry => {
      const date = new Date(entry.recorded_date);
      labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
      values.push(entry.weight);
    });
  } else { // year
    // 年の場合は月を表示 (例: 7月)
    sortedData.forEach(entry => {
      const date = new Date(entry.recorded_date);
      labels.push(`${date.getMonth() + 1}月`);
      values.push(entry.weight);
    });
  }

  return {
    labels,
    datasets: [{ data: values }],
  };
};


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(JSON.stringify({ error: 'Failed to authenticate user' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'month'; // 'week', 'month', 'year'

    // 期間に基づいて日付範囲を計算
    const endDate = new Date();
    const startDate = new Date();

    if (period === 'week') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(endDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(endDate.getFullYear() - 1);
    } else {
        return new Response(JSON.stringify({ message: '無効な期間パラメータです。week, month, yearのいずれかを指定してください。' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 体重履歴を取得
    const { data: historyData, error: dbError } = await supabaseAdmin
      .from('user_body_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('recorded_date', startDate.toISOString().split('T')[0]) // YYYY-MM-DD
      .lte('recorded_date', endDate.toISOString().split('T')[0])   // YYYY-MM-DD
      .order('recorded_date', { ascending: false });

    if (dbError) {
      console.error('体重履歴の取得に失敗しました:', dbError);
      return new Response(JSON.stringify({ message: '体重履歴の取得に失敗しました', error: dbError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let currentWeight = null;
    let startWeight = null;
    let weightChange = null;

    if (historyData && historyData.length > 0) {
      // recorded_date で降順ソート済みなので、最初が最新
      currentWeight = historyData[0].weight;
      // 期間内の最も古いデータ（配列の最後）を開始体重とする
      startWeight = historyData[historyData.length - 1].weight;
      weightChange = currentWeight && startWeight ? currentWeight - startWeight : null;
    }

    const chartData = formatChartData(historyData || [], period);

    return new Response(JSON.stringify({
      history: historyData,
      stats: {
        current: currentWeight,
        start: startWeight,
        change: weightChange,
      },
      chartData,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('サーバーエラー:', error);
    return new Response(JSON.stringify({ message: 'サーバーエラー', error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 