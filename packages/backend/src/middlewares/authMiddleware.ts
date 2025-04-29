import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js'; // または Node.js 用クライアント

// Supabaseクライアントを初期化 (環境変数などから設定)
const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // ★バックエンドではサービスロールキーが必要★
const supabase = createClient(supabaseUrl, serviceRoleKey);

// ExpressのRequestインターフェースを拡張してuserプロパティを追加
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; [key: string]: any }; // ユーザー情報の型を定義
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
    return res.sendStatus(401); // トークンがない場合は未認証
  }

  try {
    // Supabaseにトークンを検証させる
    // - getUserの処理結果として、userとerrorが返ってくる。それらを分割代入する書き方。
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error('Token validation error:', error?.message);
      return res.sendStatus(403); // トークンが無効またはユーザーが見つからない
    }

    // 検証成功、ユーザー情報をリクエストに追加
    req.user = { id: user.id, ...user }; // 必要に応じて他のユーザー情報も追加
    next(); // 次のミドルウェアまたはコントローラーへ
  } catch (err) {
    console.error('Auth middleware unexpected error:', err);
    return res.sendStatus(500); // 予期せぬエラー
  }
};
