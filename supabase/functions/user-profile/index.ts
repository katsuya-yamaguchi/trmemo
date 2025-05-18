import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

async function getUserProfile(req: Request, supabaseClientForRequest: SupabaseClient) {
  try {
    const { data: { user: authUser }, error: authUserError } = await supabaseClientForRequest.auth.getUser();

    console.log("Auth user from token (in getUserProfile):", authUser);

    if (authUserError || !authUser) {
      console.error("User retrieval error:", authUserError);
      return new Response(JSON.stringify({ message: "認証されていません" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authUser.id;
    console.log("User ID from supabase.auth.getUser():", userId);

    try {
      const { data: rpcAuthUid, error: rpcError } = await supabaseClientForRequest.rpc('get_current_session_auth_uid');
      if (rpcError) {
        console.error("Error calling RPC get_current_session_auth_uid:", rpcError);
      } else {
        console.log("auth.uid() from DB session (RPC get_current_session_auth_uid):", rpcAuthUid);
        if (userId === rpcAuthUid) {
          console.log("SUCCESS: userId from getUser() and rpcAuthUid ARE THE SAME.");
        } else {
          console.error("FAILURE: userId from getUser() and rpcAuthUid ARE DIFFERENT.");
          console.error(`userId: ${userId}, rpcAuthUid: ${rpcAuthUid}`);
        }
      }
    } catch (e) {
      console.error("Exception during RPC call:", e);
    }

    console.log("Attempting to fetch profile for userId (variable used in .eq()):", userId);

    const { data: userProfiles, error: profileError } = await supabaseClientForRequest
      .from("users")
      .select("id, email, name, profile_image_url, two_factor_enabled, created_at")
      .eq("id", userId);

    console.log("userProfiles:", userProfiles);

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ message: "ユーザープロフィールの取得に失敗しました", error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!userProfiles || userProfiles.length === 0) { 
        return new Response(JSON.stringify({ message: "ユーザープロフィールが見つかりません" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (userProfiles.length > 1) {
        console.warn(`Multiple user profiles found for userId: ${userId}. Returning the first one.`);
    }
    const userProfile = userProfiles[0];

    return new Response(JSON.stringify(userProfile), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error in getUserProfile:", error);
    return new Response(JSON.stringify({ message: "サーバーエラーが発生しました" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function updateUserProfile(req: Request, supabaseClientForRequest: SupabaseClient) {
  try {
    const { data: { user: authUser }, error: authUserError } = await supabaseClientForRequest.auth.getUser();

    console.log("Auth user from token (in updateUserProfile):", authUser);

    if (authUserError || !authUser) {
      console.error("User update - authentication error:", authUserError);
      return new Response(JSON.stringify({ message: "認証されていません" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authUser.id;

    let updateData: { name?: string; profile_image_url?: string } = {};
    try {
        const body = await req.json();
        if (body.name !== undefined) updateData.name = body.name;
        if (body.profile_image_url !== undefined) updateData.profile_image_url = body.profile_image_url; 
    } catch (e) {
        return new Response(JSON.stringify({ message: "リクエストボディが不正です" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
    }

    if (Object.keys(updateData).length === 0) {
        return new Response(JSON.stringify({ message: "更新するデータがありません" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
    }
    
    const { data: updatedProfile, error: updateError } = await supabaseClientForRequest
      .from("users")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select("id, email, name, profile_image_url, two_factor_enabled, created_at, updated_at")
      .single();

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return new Response(JSON.stringify({ message: "プロフィール更新に失敗しました", error: updateError.message }), {
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error in updateUserProfile:", error);
    return new Response(JSON.stringify({ message: "サーバーエラーが発生しました" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ message: "認証ヘッダーがありません" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseClientForRequest = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const url = new URL(req.url);
  console.log("Received request to:", url.pathname, "with method:", req.method);

  if (url.pathname === '/user-profile' || url.pathname === '/user-profile/') {
    if (req.method === "GET") {
      return await getUserProfile(req, supabaseClientForRequest);
    }
    if (req.method === "PUT") {
      return await updateUserProfile(req, supabaseClientForRequest);
    }
  }
  
  return new Response(JSON.stringify({ message: "指定されたエンドポイントまたはメソッドは許可されていません" }), {
    status: 404, 
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}); 
