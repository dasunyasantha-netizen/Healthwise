import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getDashboard, getWeeklyStats } from '../controllers/dashboardController';

const router = Router();
router.use(authenticateToken as any);
router.get('/', getDashboard as any);
router.get('/weekly', getWeeklyStats as any);
export default router;
