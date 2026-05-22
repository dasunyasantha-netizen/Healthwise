import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    getHabits, createHabit, updateHabit, deleteHabit,
    getHabitsByDate, completeHabit, uncompleteHabit, getHabitStats
} from '../controllers/habitController';

const router = Router();
router.use(authenticateToken as any);
router.get('/', getHabits as any);
router.post('/', createHabit as any);
router.get('/date/:date', getHabitsByDate as any);
router.put('/:id', updateHabit as any);
router.delete('/:id', deleteHabit as any);
router.post('/:id/complete', completeHabit as any);
router.post('/:id/uncomplete', uncompleteHabit as any);
router.get('/:id/stats', getHabitStats as any);
export default router;
