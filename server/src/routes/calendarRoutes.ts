import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getMonthCalendar, getDayDetail } from '../controllers/calendarController';

const router = Router();
router.use(authenticateToken as any);
router.get('/month', getMonthCalendar as any);
router.get('/day/:date', getDayDetail as any);
export default router;
