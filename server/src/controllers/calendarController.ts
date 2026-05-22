import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';

export const getMonthCalendar = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const daysInMonth = getDaysInMonth(new Date(year, month - 1));

    const dateRange = Array.from({ length: daysInMonth }, (_, i) =>
        `${monthStr}-${String(i + 1).padStart(2, '0')}`
    );

    const [workoutSessions, mealLogs, fastingSessions, habitCompletions, measurements] = await Promise.all([
        prisma.workoutSession.findMany({
            where: { userId, date: { in: dateRange }, status: 'completed' },
            select: { date: true }
        }),
        prisma.mealLog.findMany({
            where: { userId, date: { in: dateRange } },
            select: { date: true }
        }),
        prisma.fastingSession.findMany({
            where: { userId, status: 'completed' },
            select: { startTime: true }
        }),
        prisma.habitCompletion.findMany({
            where: { userId, date: { in: dateRange }, completed: true },
            select: { date: true }
        }),
        prisma.healthMeasurement.findMany({
            where: { userId, date: { in: dateRange } },
            select: { date: true }
        })
    ]);

    const fastingDates = new Set(
        fastingSessions.map(f => format(f.startTime, 'yyyy-MM-dd'))
    );

    const calendarData: Record<string, any> = {};
    for (const date of dateRange) {
        calendarData[date] = {
            hasWorkout: workoutSessions.some(w => w.date === date),
            hasMeal: mealLogs.some(m => m.date === date),
            hasFasting: fastingDates.has(date),
            hasHabit: habitCompletions.some(h => h.date === date),
            hasMeasurement: measurements.some(m => m.date === date)
        };
    }

    res.json({ year, month, days: calendarData });
};

export const getDayDetail = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const date = req.params.date;

    const [workoutSessions, mealLogs, fastingSessions, habitCompletions, measurements] = await Promise.all([
        prisma.workoutSession.findMany({
            where: { userId, date },
            include: {
                workoutPlan: { select: { name: true } },
                exerciseLogs: { include: { exercise: { select: { name: true, category: true } }, sets: true } }
            }
        }),
        prisma.mealLog.findMany({
            where: { userId, date },
            orderBy: { time: 'asc' }
        }),
        prisma.fastingSession.findMany({
            where: {
                userId,
                startTime: {
                    gte: new Date(`${date}T00:00:00`),
                    lt: new Date(`${date}T23:59:59`)
                }
            }
        }),
        prisma.habitCompletion.findMany({
            where: { userId, date },
            include: { habit: { select: { name: true } } }
        }),
        prisma.healthMeasurement.findMany({
            where: { userId, date }
        })
    ]);

    const totalCalories = mealLogs.reduce((sum, m) => sum + (m.calories || 0), 0);
    const totalProtein = mealLogs.reduce((sum, m) => sum + (m.protein || 0), 0);
    const totalWater = mealLogs.reduce((sum, m) => sum + (m.waterMl || 0), 0);

    res.json({
        date,
        workoutSessions,
        mealLogs,
        mealSummary: { totalCalories, totalProtein, totalWater },
        fastingSessions,
        habitCompletions,
        measurements
    });
};
