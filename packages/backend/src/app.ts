// src/app.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './config/database';  // データベースクライアントをインポート

// ルートをインポート
import homeRoutes from './routes/homeRoutes';
import userRoutes from './routes/userRoutes';
import workoutRoutes from './routes/workoutRoutes';

dotenv.config();
const app = express();

// ミドルウェアの設定
app.use(cors());
app.use(express.json()); // JSONボディをパース

// ルート設定
app.use('/api/home', homeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);

// 基本的なヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'サーバーは正常に稼働しています' });
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'サーバーエラーが発生しました',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

export default app;