import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js'; // または Node.js 用クライアント

// Supabaseクライアントを初期化 (環境変数などから設定)
const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // ★バックエンドではサービスロールキーが必要★
// Service Role Key が設定されていない場合はエラーを出す
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing in environment variables.');
  // アプリケーション起動時にエラーにする方が良いかもしれない
  // throw new Error('Supabase URL or Service Role Key is missing.');
}
const supabase = createClient(supabaseUrl, serviceRoleKey);

// ExpressのRequestインターフェースを拡張してuserプロパティを追加
declare global {
  namespace Express {
    interface Request {
      user?: { id: string }; // middlewareからは検証済みのIDのみを渡すことを推奨
    }
  }
}

/**
 * JWTトークンを使用してユーザー認証を行うミドルウェア
 * 
 * @param req - Expressのリクエストオブジェクト
 * @param res - Expressのレスポンスオブジェクト
 * @param next - 次のミドルウェアを呼び出す関数
 * 
 * @description
 * このミドルウェアは以下の処理を行います：
 * 1. リクエストヘッダーからAuthorizationトークンを取得
 * 2. Supabase認証を使用してトークンを検証
 * 3. 有効なトークンの場合、ユーザー情報をreq.userに設定して次のミドルウェアへ進む
 * 4. 無効なトークンの場合、適切なエラーレスポンスを返す
 * 
 * @returns void
 * @throws 401 - トークンが存在しない場合
 * @throws 403 - トークンが無効またはユーザーが見つからない場合
 * @throws 500 - 予期せぬエラーが発生した場合
 */

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" から TOKEN を抽出

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  try {
    // 1. Supabaseにトークンを検証させる
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);

    // トークン検証エラー時の処理
    if (getUserError || !user) {
      console.error('Token validation failed:', getUserError?.message);
      if (getUserError?.message.includes('invalid JWT')) {
          return res.status(401).json({ message: 'Invalid or expired token.' });
      }
      // その他の検証エラー (ネットワークエラー等も含む)
      return res.status(403).json({ message: 'Failed to validate token or user not found.' });
    }

    // 2. public.users テーブルにプロファイルが存在するか確認
    const { data: profile, error: profileCheckError } = await supabase
      .from('users') // public スキーマの users テーブル
      .select('id')
      .eq('id', user.id)
      .maybeSingle(); // 結果が0件または1件の場合に対応 (0件なら null が返る)

    // プロファイル確認中に予期せぬエラーが発生した場合
    if (profileCheckError) {
       console.error('Error checking user profile:', profileCheckError);
       return res.status(500).json({ message: 'Error checking user profile data.' });
    }

    // 3. プロファイルが存在しない場合は作成
    if (!profile) {
      console.log(`Profile for user ${user.id} not found. Creating entry in public.users.`);
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email, // 必須項目
          // name は一旦 email の @ より前を使うか、デフォルト値を設定
          name: user.email?.split('@')[0] || `User_${user.id.substring(0, 6)}`,
          // 他に必要な初期値があればここに追加
        });

      // プロファイル作成中にエラーが発生した場合
      if (insertError) {
        console.error('Failed to create user profile:', insertError);
        return res.status(500).json({ message: 'Could not create user profile.' });
      }
      console.log(`Profile created successfully for user ${user.id}`);
    } else {
      // 既存ユーザーの場合のログ (デバッグ用)
      // console.log(`Profile found for user ${user.id}`);
    }

    // 4. 検証済みのユーザーIDをリクエストに追加
    // コントローラー側ではこのIDを使って必要なデータを取得する
    req.user = { id: user.id };

    // 5. 次のミドルウェアまたはコントローラーへ処理を渡す
    next();

  } catch (err) {
    // このミドルウェア内で予期せぬエラーが発生した場合
    console.error('Unexpected error in authMiddleware:', err);
    return res.status(500).json({ message: 'Internal server error during authentication process.' });
  }
};
