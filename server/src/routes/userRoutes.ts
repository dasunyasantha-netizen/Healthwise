import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
export default router;
