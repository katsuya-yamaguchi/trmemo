import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

interface NotificationSettings {
  enabled: boolean;
  reminder_time?: string; // e.g., "09:00"
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'PUT') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

    const { enabled, reminder_time }: NotificationSettings = await req.json();

    if (typeof enabled !== 'boolean') {
      return new Response(JSON.stringify({ message: '必須項目 (enabled) が不足しているか、型が不正です' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const settingsToUpsert = {
      user_id: user.id,
      notifications_enabled: enabled,
      reminder_time: reminder_time, // reminder_time can be null or undefined if not provided
      updated_at: new Date().toISOString(),
    };

    // created_at はupsert時に自動で設定されるか、DBのデフォルト値に依存。
    // もし明示的に初回挿入時のみ設定したい場合は、別途ロジックが必要。
    // ここでは updated_at のみ更新。

    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert(settingsToUpsert, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('通知設定の保存に失敗しました:', error);
      return new Response(JSON.stringify({ message: '通知設定の保存に失敗しました', error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('サーバーエラー:', error);
    // Check if error is a SyntaxError from req.json()
    if (error instanceof SyntaxError) {
        return new Response(JSON.stringify({ message: 'Invalid JSON payload', error: error.message }), {
            status: 400, // Bad Request
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    return new Response(JSON.stringify({ message: 'サーバーエラー', error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 