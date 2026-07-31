import express from 'express';
import { getMyAnalytics, getUserAnalytics } from '../controllers/analyticsController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);
router.get('/me', getMyAnalytics);
router.get('/users/:userId', requireRole('coach', 'admin'), getUserAnalytics);

export default router;
