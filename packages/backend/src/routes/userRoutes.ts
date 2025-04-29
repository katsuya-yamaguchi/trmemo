// src/routes/userRoutes.ts
import express from 'express';
import { 
  getUserProfile, 
  updateUserProfile, 
  recordBodyStats, 
  getBodyStatsHistory, 
  updateNotificationSettings 
} from '../controllers/userController';

const router = express.Router();

// ユーザープロフィール取得
router.get('/profile', getUserProfile);

// ユーザープロフィール更新
router.put('/profile', updateUserProfile);

// 体重・体組成の記録
router.post('/body-stats', recordBodyStats);

// 体重・体組成の履歴取得
router.get('/body-stats', getBodyStatsHistory);

// 通知設定の更新
router.put('/notifications', updateNotificationSettings);

export default router;