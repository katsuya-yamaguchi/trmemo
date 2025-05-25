import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

interface BodyStatRecord {
  weight: number;
  body_fat?: number;
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

    const { weight, body_fat, date }: BodyStatRecord = await req.json();

    if (!weight || !date) {
      return new Response(JSON.stringify({ message: '必須項目 (weight, date) が不足しています' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate date format if necessary, assuming YYYY-MM-DD
    const recordedDate = new Date(date);
    if (isNaN(recordedDate.getTime())) {
        return new Response(JSON.stringify({ message: '無効な日付形式です。YYYY-MM-DD形式で送信してください。' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('body_stats')
      .insert({
        user_id: user.id,
        weight,
        body_fat_percentage: body_fat,
        recorded_at: recordedDate.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('体重データの記録に失敗しました:', insertError);
      return new Response(JSON.stringify({ message: '体重データの記録に失敗しました', error: insertError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: '体重データを記録しました', data: insertData }), {
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