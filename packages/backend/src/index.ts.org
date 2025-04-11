import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { APP_NAME } from '@trmemo/shared';

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabaseクライアント設定
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ミドルウェア
app.use(cors());
app.use(express.json());

// Hello World API
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello World from Express API!' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(\`\${APP_NAME} API server running on port \${PORT}\`);
});
