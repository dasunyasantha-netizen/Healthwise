import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    getWorkoutPlans, getWorkoutPlan, createWorkoutPlan,
    updateWorkoutPlan, deleteWorkoutPlan, duplicateWorkoutPlan,
    getWorkoutSessions, getWorkoutSessionByDate, createWorkoutSession,
    updateWorkoutSession, completeWorkoutSession, deleteWorkoutSession,
    addExerciseLog, updateExerciseLog,
    addSetLog, updateSetLog, deleteSetLog,
    getExerciseHistory
} from '../controllers/workoutController';

const router = Router();
router.use(authenticateToken as any);

// Plans
router.get('/plans', getWorkoutPlans as any);
router.get('/plans/:id', getWorkoutPlan as any);
router.post('/plans', createWorkoutPlan as any);
router.put('/plans/:id', updateWorkoutPlan as any);
router.delete('/plans/:id', deleteWorkoutPlan as any);
router.post('/plans/:id/duplicate', duplicateWorkoutPlan as any);

// Sessions
router.get('/sessions', getWorkoutSessions as any);
router.get('/sessions/date/:date', getWorkoutSessionByDate as any);
router.post('/sessions', createWorkoutSession as any);
router.put('/sessions/:id', updateWorkoutSession as any);
router.post('/sessions/:id/complete', completeWorkoutSession as any);
router.delete('/sessions/:id', deleteWorkoutSession as any);
router.post('/sessions/:id/exercise-logs', addExerciseLog as any);

// Exercise logs
router.put('/exercise-logs/:id', updateExerciseLog as any);
router.post('/exercise-logs/:id/sets', addSetLog as any);

// Set logs
router.put('/set-logs/:id', updateSetLog as any);
router.delete('/set-logs/:id', deleteSetLog as any);

// Exercise history
router.get('/history/:exerciseId', getExerciseHistory as any);

export default router;
