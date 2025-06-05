import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

interface BodyStatRecord {
  weight: number;
  body_fat_percentage?: number;
  date: string; // YYYY-MM-DD format expected from client
}

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

    const { weight, body_fat_percentage, date }: BodyStatRecord = await req.json();

    // バリデーション
    if (!weight || !date) {
      return new Response(JSON.stringify({ error: '必須項目 (weight, date) が不足しています' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (weight <= 0 || weight > 999.99) {
      return new Response(JSON.stringify({ error: '体重は0より大きく999.99以下で入力してください' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body_fat_percentage !== undefined && (body_fat_percentage < 0 || body_fat_percentage > 100)) {
      return new Response(JSON.stringify({ error: '体脂肪率は0以上100以下で入力してください' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 日付フォーマットの検証（YYYY-MM-DD）
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return new Response(JSON.stringify({ error: '無効な日付形式です。YYYY-MM-DD形式で送信してください。' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // UPSERT (同じ日の記録があれば更新、なければ挿入)
    // created_atとupdated_atはアプリケーション側で完全管理
    const now = new Date().toISOString();
    
    // まず既存レコードの存在確認
    const { data: existingRecord } = await supabaseAdmin
      .from('body_stats')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('recorded_at', date)
      .single();

    const { data: upsertData, error: upsertError } = await supabaseAdmin
      .from('body_stats')
      .upsert({
        user_id: user.id,
        weight,
        body_fat_percentage: body_fat_percentage || null,
        recorded_at: date,
        created_at: existingRecord ? existingRecord.created_at : now, // 既存なら保持、新規なら現在時刻
        updated_at: now, // 常に現在時刻に更新
      }, {
        onConflict: 'user_id,recorded_at',
        ignoreDuplicates: false // 重複時は更新する
      })
      .select()
      .single();

    if (upsertError) {
      console.error('体重データの記録に失敗しました:', upsertError);
      return new Response(JSON.stringify({ error: '体重データの記録に失敗しました', details: upsertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(upsertData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('サーバーエラー:', error);
    return new Response(JSON.stringify({ error: 'サーバーエラー', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 