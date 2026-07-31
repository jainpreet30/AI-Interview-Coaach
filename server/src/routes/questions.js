import express from 'express';
import {
  createQuestion,
  deleteQuestion,
  getQuestionById,
  listQuestions,
  updateQuestion
} from '../controllers/questionController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/', listQuestions);
router.get('/:id', getQuestionById);
router.post('/', requireAuth, requireRole('coach', 'admin'), createQuestion);
router.put('/:id', requireAuth, requireRole('coach', 'admin'), updateQuestion);
router.delete('/:id', requireAuth, requireRole('admin'), deleteQuestion);

export default router;
