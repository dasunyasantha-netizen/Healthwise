import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import workoutRoutes from './routes/workoutRoutes';
import mealRoutes from './routes/mealRoutes';
import fastingRoutes from './routes/fastingRoutes';
import habitRoutes from './routes/habitRoutes';
import measurementRoutes from './routes/measurementRoutes';
import calendarRoutes from './routes/calendarRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();
const PORT = process.env.PORT || 4500;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/fasting', fastingRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', app: 'healthwise', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`HealthWise API running on port ${PORT}`);
});
