// src/routes/workoutRoutes.ts
import express from 'express';
import { 
  getUserTrainingPlan, 
  getDayWorkout, 
  recordExerciseSet,
  startTrainingSession,
  completeTrainingSession,
  getExerciseLibrary,
  getExerciseDetails,
  getProgressData,
  getWorkoutHistory
} from '../controllers/workoutController';

const router = express.Router();

// トレーニングプラン関連
router.get('/plan', getUserTrainingPlan);
router.get('/day/:dayId', getDayWorkout);

// トレーニングセッション関連
router.post('/session/start', startTrainingSession);
router.post('/session/complete', completeTrainingSession);
router.post('/record', recordExerciseSet);

// エクササイズライブラリ関連
router.get('/exercises', getExerciseLibrary);
router.get('/exercises/:exerciseId', getExerciseDetails);

// 進捗データ関連
router.get('/progress', getProgressData);
router.get('/history', getWorkoutHistory);

export default router;