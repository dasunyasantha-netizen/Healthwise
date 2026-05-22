import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    getMeasurements, getLatestMeasurement, createMeasurement,
    updateMeasurement, deleteMeasurement, getMeasurementTrends
} from '../controllers/measurementController';

const router = Router();
router.use(authenticateToken as any);
router.get('/', getMeasurements as any);
router.get('/latest', getLatestMeasurement as any);
router.get('/trends', getMeasurementTrends as any);
router.post('/', createMeasurement as any);
router.put('/:id', updateMeasurement as any);
router.delete('/:id', deleteMeasurement as any);
export default router;
