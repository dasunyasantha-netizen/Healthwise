import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    getExercises, getExercise, createExercise,
    updateExercise, deleteExercise
} from '../controllers/exerciseController';

const router = Router();
router.use(authenticateToken as any);
router.get('/', getExercises as any);
router.get('/:id', getExercise as any);
router.post('/', createExercise as any);
router.put('/:id', updateExercise as any);
router.delete('/:id', deleteExercise as any);
export default router;
