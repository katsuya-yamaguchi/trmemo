// src/app.ts
import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './config/database';  // データベースクライアントをインポート

// ルートをインポート
import homeRoutes from './routes/homeRoutes';
import userRoutes from './routes/userRoutes';
import workoutRoutes from './routes/workoutRoutes';
import legalRoutes from './routes/legalRoutes'; // Import the new legal routes

dotenv.config();
const app = express();

// ミドルウェアの設定
app.use(cors());
app.use(express.json()); // JSONボディをパース

// ルート設定
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/legal', legalRoutes);

// 基本的なヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'サーバーは正常に稼働しています' });
});

// エラーハンドリングミドルウェア
const errorHandler: ErrorRequestHandler = (err, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack); // err.stack は Error 型であれば存在
  const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
  res.status(500).json({
    message: 'サーバーエラーが発生しました',
    error: process.env.NODE_ENV === 'production' ? undefined : errorMessage
  });
};
app.use(errorHandler);

export default app;