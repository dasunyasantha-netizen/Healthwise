import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import { getMeals, getMealsByDate, createMeal, updateMeal, deleteMeal } from '../controllers/mealController';

const router = Router();
router.use(authenticateToken as any);
router.get('/', getMeals as any);
router.get('/date/:date', getMealsByDate as any);
router.post('/', createMeal as any);
router.put('/:id', updateMeal as any);
router.delete('/:id', deleteMeal as any);
export default router;
