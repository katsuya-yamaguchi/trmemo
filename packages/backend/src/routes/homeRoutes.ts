// src/routes/homeRoutes.ts
import express from 'express';
import { HomeController } from '../controllers/homeController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = express.Router();
const homeController = new HomeController();

// ホーム画面データの取得
router.get('/', authenticateToken, homeController.getHomeScreenData);

export default router;
