// src/app.ts
import express from 'express';
import cors from 'cors';
import supabase from './config/database';  // データベースクライアントをインポート
import dotenv from 'dotenv';
import workoutRoutes from './routes/workoutRoutes';

dotenv.config();
const app = express();

// ミドルウェアの設定
app.use(cors());
app.use(express.json()); // JSONボディをパース

// ルート設定
app.use('/api/workouts', workoutRoutes);

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('サーバーエラー');
});

export default app;