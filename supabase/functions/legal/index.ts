import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

// 環境変数からSupabaseのURLとサービスロールキーを取得
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const action = pathSegments[pathSegments.length - 1];

  let type = '';
  if (action === 'privacy-policy') type = 'privacy_policy';
  if (action === 'terms-of-service') type = 'terms_of_service';

  if (!type) {
    return new Response(JSON.stringify({ message: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('content')
      .eq('document_type', type)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ message: 'Not Found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ content: data.content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(`Error serving document:`, error);
    return new Response(JSON.stringify({ 
      message: `文書の取得中にエラーが発生しました。`, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 