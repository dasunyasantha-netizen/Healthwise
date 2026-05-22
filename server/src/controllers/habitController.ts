import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

export const getHabits = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const habits = await prisma.habit.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' }
    });
    res.json(habits);
};

export const createHabit = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const habit = await prisma.habit.create({
        data: { userId, ...req.body, selectedDays: req.body.selectedDays || [] }
    });
    res.status(201).json(habit);
};

export const updateHabit = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.habit.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Habit not found' }); return; }
    const habit = await prisma.habit.update({ where: { id: req.params.id }, data: req.body });
    res.json(habit);
};

export const deleteHabit = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.habit.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Habit not found' }); return; }
    await prisma.habit.delete({ where: { id: req.params.id } });
    res.json({ success: true });
};

export const getHabitsByDate = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const date = req.params.date;

    const habits = await prisma.habit.findMany({ where: { userId, active: true } });
    const completions = await prisma.habitCompletion.findMany({
        where: { userId, date }
    });

    const result = habits.map(h => ({
        ...h,
        completion: completions.find(c => c.habitId === h.id) || null
    }));
    res.json(result);
};

export const completeHabit = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { date, value, notes } = req.body;
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId } });
    if (!habit) { res.status(404).json({ error: 'Habit not found' }); return; }

    const completion = await prisma.habitCompletion.upsert({
        where: { habitId_date: { habitId: req.params.id, date: targetDate } },
        update: { completed: true, value, notes, userId },
        create: { habitId: req.params.id, userId, date: targetDate, completed: true, value, notes }
    });
    res.json(completion);
};

export const uncompleteHabit = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { date } = req.body;
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId } });
    if (!habit) { res.status(404).json({ error: 'Habit not found' }); return; }

    const completion = await prisma.habitCompletion.upsert({
        where: { habitId_date: { habitId: req.params.id, date: targetDate } },
        update: { completed: false, userId },
        create: { habitId: req.params.id, userId, date: targetDate, completed: false }
    });
    res.json(completion);
};

export const getHabitStats = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const habit = await prisma.habit.findFirst({ where: { id: req.params.id, userId } });
    if (!habit) { res.status(404).json({ error: 'Habit not found' }); return; }

    const completions = await prisma.habitCompletion.findMany({
        where: { habitId: req.params.id, completed: true },
        orderBy: { date: 'asc' }
    });

    const today = format(new Date(), 'yyyy-MM-dd');
    const completedDates = new Set(completions.map(c => c.date));

    // Current streak (backwards from today)
    let currentStreak = 0;
    let checkDate = today;
    while (completedDates.has(checkDate)) {
        currentStreak++;
        checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
    }

    // Longest streak
    let longestStreak = 0;
    let streak = 0;
    let prevDate: string | null = null;
    for (const c of completions) {
        if (prevDate) {
            const diff = differenceInDays(parseISO(c.date), parseISO(prevDate));
            if (diff === 1) {
                streak++;
            } else {
                longestStreak = Math.max(longestStreak, streak);
                streak = 1;
            }
        } else {
            streak = 1;
        }
        prevDate = c.date;
    }
    longestStreak = Math.max(longestStreak, streak);

    // Completion rates
    const last7 = Array.from({ length: 7 }, (_, i) =>
        format(subDays(new Date(), i), 'yyyy-MM-dd')
    );
    const last30 = Array.from({ length: 30 }, (_, i) =>
        format(subDays(new Date(), i), 'yyyy-MM-dd')
    );

    const rate7 = last7.filter(d => completedDates.has(d)).length / 7;
    const rate30 = last30.filter(d => completedDates.has(d)).length / 30;

    // Milestone badges
    const milestones = [3, 7, 14, 30, 60, 100];
    const earnedBadges = milestones.filter(m => longestStreak >= m);

    res.json({
        currentStreak,
        longestStreak,
        totalCompletions: completions.length,
        completionRate7Days: Math.round(rate7 * 100),
        completionRate30Days: Math.round(rate30 * 100),
        earnedBadges,
        recentCompletions: completions.slice(-30).map(c => c.date)
    });
};
