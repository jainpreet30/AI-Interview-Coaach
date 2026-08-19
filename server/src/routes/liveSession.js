import express from 'express';
import {
  createLiveSession,
  getLiveSession,
  listLiveSessions,
  completeLiveSession,
  deleteLiveSession
} from '../controllers/liveSessionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Create a new live session
router.post('/', createLiveSession);

// List all live sessions for the user
router.get('/', listLiveSessions);

// Get a specific live session
router.get('/:id', getLiveSession);

// Complete a live session
router.put('/:id/complete', completeLiveSession);

// Delete a live session
router.delete('/:id', deleteLiveSession);

export default router;
