import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

export const getDashboard = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const today = format(new Date(), 'yyyy-MM-dd');
    const last7Days = Array.from({ length: 7 }, (_, i) =>
        format(subDays(new Date(), i), 'yyyy-MM-dd')
    );

    const [
        todayWorkouts,
        todayMeals,
        activeFasting,
        todayHabits,
        allHabits,
        latestMeasurement,
        weeklyWorkouts
    ] = await Promise.all([
        prisma.workoutSession.findMany({
            where: { userId, date: today },
            include: { exerciseLogs: { include: { exercise: true } } }
        }),
        prisma.mealLog.findMany({ where: { userId, date: today } }),
        prisma.fastingSession.findFirst({ where: { userId, status: 'active' } }),
        prisma.habitCompletion.findMany({ where: { userId, date: today } }),
        prisma.habit.findMany({ where: { userId, active: true } }),
        prisma.healthMeasurement.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
        prisma.workoutSession.findMany({
            where: { userId, date: { in: last7Days }, status: 'completed' },
            select: { date: true }
        })
    ]);

    const mealSummary = {
        calories: todayMeals.reduce((s, m) => s + (m.calories || 0), 0),
        protein: todayMeals.reduce((s, m) => s + (m.protein || 0), 0),
        carbs: todayMeals.reduce((s, m) => s + (m.carbs || 0), 0),
        fat: todayMeals.reduce((s, m) => s + (m.fat || 0), 0),
        water: todayMeals.reduce((s, m) => s + (m.waterMl || 0), 0),
        count: todayMeals.length
    };

    const habitsCompleted = todayHabits.filter(h => h.completed).length;
    const habitScore = allHabits.length > 0
        ? Math.round((habitsCompleted / allHabits.length) * 100)
        : 0;

    let measurementStatus = null;
    if (latestMeasurement) {
        const daysSince = differenceInDays(new Date(), parseISO(latestMeasurement.date));
        measurementStatus = {
            daysSince,
            isOverdue: daysSince >= 14,
            dueIn: Math.max(0, 14 - daysSince),
            overdueDays: daysSince >= 14 ? daysSince - 14 : 0
        };
    }

    res.json({
        today,
        workouts: {
            sessions: todayWorkouts,
            count: todayWorkouts.length,
            completed: todayWorkouts.filter(s => s.status === 'completed').length
        },
        meals: mealSummary,
        fasting: activeFasting,
        habits: {
            total: allHabits.length,
            completed: habitsCompleted,
            score: habitScore,
            list: allHabits.map(h => ({
                ...h,
                completion: todayHabits.find(c => c.habitId === h.id) || null
            }))
        },
        measurement: {
            latest: latestMeasurement,
            status: measurementStatus
        },
        weeklyWorkoutCount: weeklyWorkouts.length
    });
};

export const getWeeklyStats = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const last7Days = Array.from({ length: 7 }, (_, i) =>
        format(subDays(new Date(), i), 'yyyy-MM-dd')
    ).reverse();

    const [workouts, meals, habits] = await Promise.all([
        prisma.workoutSession.findMany({
            where: { userId, date: { in: last7Days } },
            select: { date: true, status: true }
        }),
        prisma.mealLog.findMany({
            where: { userId, date: { in: last7Days } },
            select: { date: true, calories: true, protein: true, waterMl: true }
        }),
        prisma.habitCompletion.findMany({
            where: { userId, date: { in: last7Days } },
            select: { date: true, completed: true }
        })
    ]);

    const days = last7Days.map(date => ({
        date,
        workouts: workouts.filter(w => w.date === date).length,
        workoutCompleted: workouts.some(w => w.date === date && w.status === 'completed'),
        calories: meals.filter(m => m.date === date).reduce((s, m) => s + (m.calories || 0), 0),
        habitsCompleted: habits.filter(h => h.date === date && h.completed).length
    }));

    res.json({ days });
};
