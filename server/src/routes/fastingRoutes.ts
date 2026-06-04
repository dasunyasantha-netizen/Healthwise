import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    getFastingSessions, getActiveFasting,
    startFasting, endFasting, cancelFasting, deleteFasting
} from '../controllers/fastingController';

const router = Router();
router.use(authenticateToken as any);
router.get('/', getFastingSessions as any);
router.get('/active', getActiveFasting as any);
router.post('/start', startFasting as any);
router.post('/:id/end', endFasting as any);
router.post('/:id/cancel', cancelFasting as any);
router.delete('/:id', deleteFasting as any);
export default router;
