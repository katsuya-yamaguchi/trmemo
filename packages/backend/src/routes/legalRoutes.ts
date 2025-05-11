import express from 'express';
import { getTermsOfService, getPrivacyPolicy } from '../controllers/legalController';

const router = express.Router();

// 利用規約取得エンドポイント
router.get('/terms-of-service', getTermsOfService);

// プライバシーポリシー取得エンドポイント
router.get('/privacy-policy', getPrivacyPolicy);

export default router; 