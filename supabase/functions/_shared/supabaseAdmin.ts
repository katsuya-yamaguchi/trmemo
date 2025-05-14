import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl) {
  console.error('環境変数エラー: SUPABASE_URL が設定されていません。');
  throw new Error('SUPABASE_URL が設定されていません。Edge Functionの環境変数に設定されているか確認してください。');
}
if (!supabaseServiceRoleKey) {
  console.error('環境変数エラー: SUPABASE_SERVICE_ROLE_KEY が設定されていません。');
  throw new Error('SUPABASE_SERVICE_ROLE_KEY が設定されていません。Edge Functionの環境変数に設定されているか確認してください。');
}

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  }
}); 