// src/routes/workoutRoutes.ts
import express from 'express';
import { 
  getUserTrainingPlan, 
  getDayWorkout, 
  recordExerciseSet,
  startTrainingSession,
  completeTrainingSession,
} from '../controllers/workoutController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();

// トレーニングプラン関連
router.get('/plan', authenticateToken, getUserTrainingPlan);
router.get('/day/:dayId', authenticateToken, getDayWorkout);

// トレーニングセッション関連
router.post('/session/start', authenticateToken, startTrainingSession);
router.post('/session/complete', authenticateToken, completeTrainingSession);
router.post('/record', authenticateToken, recordExerciseSet);

// エクササイズライブラリ関連
// エクセサイズのライブラリであり、公開情報であるため認証不要
// router.get('/exercises', getExerciseLibrary);
// router.get('/exercises/:exerciseId', getExerciseDetails);

// 進捗データ関連
// router.get('/progress', authenticateToken, getProgressData);

// トレーニング履歴取得 (認証必要)
// router.get('/history', authenticateToken, getWorkoutHistory);

export default router;