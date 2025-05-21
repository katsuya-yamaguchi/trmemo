// src/routes/userRoutes.ts
import express from 'express';
/* // controllerからのインポートをすべて削除
import { 
  // recordBodyStats, // 削除
  // getBodyStatsHistory, // 削除
  // updateNotificationSettings // 削除
} from '../controllers/userController';
*/

const router = express.Router();

// ユーザープロフィール取得
// router.get('/profile', getUserProfile);

// ユーザープロフィール更新
// router.put('/profile', updateUserProfile);

// 体重・体組成の記録 // この行を削除
// router.post('/body-stats', recordBodyStats);

// 体重・体組成の履歴取得 // この行を削除
// router.get('/body-stats', getBodyStatsHistory);

// 通知設定の更新 // この行を削除
// router.put('/notifications', updateNotificationSettings);

export default router;