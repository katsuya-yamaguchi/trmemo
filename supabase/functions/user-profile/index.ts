import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
);

async function getUserProfile(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "認証ヘッダーがありません" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser(token);

    console.log("Auth user from token:", authUser);

    if (authUserError || !authUser) {
      console.error("User retrieval error:", authUserError);
      return new Response(JSON.stringify({ message: "認証されていません" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authUser.id;
    // authUserの中身をログに出力させたい
    console.log("Attempting to fetch profile for userId:", userId);

    // usersテーブルからプロフィール情報を取得
    const { data: userProfiles, error: profileError } = await supabase
      .from("users") // 'users' テーブルを指定
      .select("id, email, name, profile_image_url, two_factor_enabled, created_at")
      .eq("id", userId);

    console.log("userProfiles:", userProfiles);

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(JSON.stringify({ message: "ユーザープロフィールの取得に失敗しました", error: profileError.message }), {
        status: 500, //  PGRST116以外のエラーの可能性もあるため、汎用的な500エラー
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!userProfiles || userProfiles.length === 0) { 
        return new Response(JSON.stringify({ message: "ユーザープロフィールが見つかりません" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // idで検索しているので通常は1行だが、念のため複数返ってきた場合の考慮（ログ出力し、最初の要素を使用）
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

async function updateUserProfile(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ message: "認証ヘッダーがありません" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser(token);

    console.log("Auth user from token:", authUser);

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
        // profileImageUrlではなくprofile_image_urlをキーに修正
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
    
    const { data: updatedProfile, error: updateError } = await supabase
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  console.log("Received request to:", url.pathname);
  if (url.pathname === '/user-profile' || url.pathname === '/user-profile/') {
    if (req.method === "GET") {
      return await getUserProfile(req);
    }
    if (req.method === "PUT") {
      return await updateUserProfile(req);
    }
  }
  
  return new Response(JSON.stringify({ message: "指定されたエンドポイントまたはメソッドは許可されていません" }), {
    status: 404, 
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}); 