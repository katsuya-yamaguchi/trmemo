// src/routes/workoutRoutes.ts
import express from 'express';
import { getUserTrainingPlan, getDayWorkout, recordExerciseSet } from '../controllers/workoutController';

const router = express.Router();

// 各ルートの設定
router.get('/plan', getUserTrainingPlan);
router.get('/day/:dayId', getDayWorkout);
router.post('/record', recordExerciseSet);

export default router;