import express from 'express';
import { getProfile, updateProfile, listUsers, updateUserRole } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(requireAuth);
router.get('/me', getProfile);
router.put('/me', updateProfile);
router.get('/', requireRole('admin'), listUsers);
router.put('/:id/role', requireRole('admin'), updateUserRole);

export default router;
