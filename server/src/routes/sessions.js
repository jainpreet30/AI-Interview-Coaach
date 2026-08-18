import express from 'express';
import {
  completeSession,
  createSession,
  getSession,
  listSessions,
  submitAnswer
} from '../controllers/sessionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);
router.post('/', createSession);
router.get('/', listSessions);
router.get('/:id', getSession);
router.put('/:id/answer', submitAnswer);
router.post('/:id/complete', completeSession);

export default router;
