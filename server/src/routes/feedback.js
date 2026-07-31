import express from 'express';
import { getFeedbackBySession } from '../controllers/feedbackController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);
router.get('/:sessionId', getFeedbackBySession);

export default router;
