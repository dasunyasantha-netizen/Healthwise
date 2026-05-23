import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

// ─── WORKOUT PLANS ────────────────────────────────────────────────────────────

export const getWorkoutPlans = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const plans = await prisma.workoutPlan.findMany({
        where: { userId },
        include: { exercises: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json(plans);
};

export const getWorkoutPlan = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const plan = await prisma.workoutPlan.findFirst({
        where: { id: req.params.id, userId },
        include: { exercises: { include: { exercise: true }, orderBy: { orderIndex: 'asc' } } }
    });
    if (!plan) { res.status(404).json({ error: 'Plan not found' }); return; }
    res.json(plan);
};

export const createWorkoutPlan = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { name, date, isTemplate, notes, exercises } = req.body;

    const plan = await prisma.workoutPlan.create({
        data: {
            userId, name,
            date: date || null,
            isTemplate: isTemplate || false,
            notes,
            exercises: exercises ? {
                create: exercises.map((e: any, i: number) => ({
                    exerciseId: e.exerciseId,
                    orderIndex: i,
                    targetSets: e.targetSets,
                    targetReps: e.targetReps,
                    targetWeight: e.targetWeight,
                    targetTimeSeconds: e.targetTimeSeconds,
                    restSeconds: e.restSeconds,
                    notes: e.notes
                }))
            } : undefined
        },
        include: { exercises: { include: { exercise: true } } }
    });
    res.status(201).json(plan);
};

export const updateWorkoutPlan = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, date, isTemplate, notes, exercises } = req.body;

    const existing = await prisma.workoutPlan.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ error: 'Plan not found' }); return; }

    if (exercises !== undefined) {
        await prisma.workoutPlanExercise.deleteMany({ where: { workoutPlanId: id } });
    }

    const plan = await prisma.workoutPlan.update({
        where: { id },
        data: {
            name, date, isTemplate, notes,
            exercises: exercises ? {
                create: exercises.map((e: any, i: number) => ({
                    exerciseId: e.exerciseId,
                    orderIndex: i,
                    targetSets: e.targetSets,
                    targetReps: e.targetReps,
                    targetWeight: e.targetWeight,
                    targetTimeSeconds: e.targetTimeSeconds,
                    restSeconds: e.restSeconds,
                    notes: e.notes
                }))
            } : undefined
        },
        include: { exercises: { include: { exercise: true } } }
    });
    res.json(plan);
};

export const deleteWorkoutPlan = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.workoutPlan.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Plan not found' }); return; }
    await prisma.workoutPlan.delete({ where: { id: req.params.id } });
    res.json({ success: true });
};

export const duplicateWorkoutPlan = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { targetDate } = req.body;

    const original = await prisma.workoutPlan.findFirst({
        where: { id: req.params.id, userId },
        include: { exercises: true }
    });
    if (!original) { res.status(404).json({ error: 'Plan not found' }); return; }

    const copy = await prisma.workoutPlan.create({
        data: {
            userId,
            name: original.name,
            date: targetDate || null,
            isTemplate: false,
            notes: original.notes,
            exercises: {
                create: original.exercises.map(e => ({
                    exerciseId: e.exerciseId,
                    orderIndex: e.orderIndex,
                    targetSets: e.targetSets,
                    targetReps: e.targetReps,
                    targetWeight: e.targetWeight,
                    targetTimeSeconds: e.targetTimeSeconds,
                    restSeconds: e.restSeconds,
                    notes: e.notes
                }))
            }
        },
        include: { exercises: { include: { exercise: true } } }
    });
    res.status(201).json(copy);
};

// ─── WORKOUT SESSIONS ─────────────────────────────────────────────────────────

export const getWorkoutSessions = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const sessions = await prisma.workoutSession.findMany({
        where: { userId },
        include: {
            workoutPlan: true,
            exerciseLogs: { include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } } }
        },
        orderBy: { date: 'desc' }
    });
    res.json(sessions);
};

export const getWorkoutSessionByDate = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const sessions = await prisma.workoutSession.findMany({
        where: { userId, date: req.params.date },
        include: {
            workoutPlan: true,
            exerciseLogs: { include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } } }
        }
    });
    res.json(sessions);
};

export const createWorkoutSession = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { workoutPlanId, date, notes } = req.body;

    const session = await prisma.workoutSession.create({
        data: {
            userId,
            workoutPlanId: workoutPlanId || null,
            date: date || new Date().toISOString().split('T')[0],
            status: 'in_progress',
            notes
        },
        include: { exerciseLogs: true }
    });
    res.status(201).json(session);
};

export const updateWorkoutSession = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.workoutSession.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Session not found' }); return; }

    const session = await prisma.workoutSession.update({
        where: { id: req.params.id },
        data: req.body,
        include: { exerciseLogs: { include: { exercise: true, sets: true } } }
    });
    res.json(session);
};

export const completeWorkoutSession = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.workoutSession.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Session not found' }); return; }

    const session = await prisma.workoutSession.update({
        where: { id: req.params.id },
        data: { status: 'completed', endedAt: new Date() },
        include: { exerciseLogs: { include: { exercise: true, sets: true } } }
    });
    res.json(session);
};

export const deleteWorkoutSession = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.workoutSession.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Session not found' }); return; }
    await prisma.workoutSession.delete({ where: { id: req.params.id } });
    res.json({ success: true });
};

// ─── EXERCISE LOGS ────────────────────────────────────────────────────────────

export const addExerciseLog = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id: sessionId } = req.params;

    const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, userId } });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

    const { exerciseId, orderIndex, notes } = req.body;
    const log = await prisma.workoutExerciseLog.create({
        data: { workoutSessionId: sessionId, exerciseId, orderIndex: orderIndex || 0, notes },
        include: { exercise: true, sets: true }
    });
    res.status(201).json(log);
};

export const updateExerciseLog = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const log = await prisma.workoutExerciseLog.findFirst({
        where: { id: req.params.id },
        include: { workoutSession: true }
    });
    if (!log || log.workoutSession.userId !== userId) { res.status(404).json({ error: 'Log not found' }); return; }

    const updated = await prisma.workoutExerciseLog.update({
        where: { id: req.params.id },
        data: req.body,
        include: { exercise: true, sets: true }
    });
    res.json(updated);
};

// ─── SET LOGS ─────────────────────────────────────────────────────────────────

export const addSetLog = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const log = await prisma.workoutExerciseLog.findFirst({
        where: { id: req.params.id },
        include: { workoutSession: true }
    });
    if (!log || log.workoutSession.userId !== userId) { res.status(404).json({ error: 'Log not found' }); return; }

    const { setNumber, weight, reps, timeSeconds, completed } = req.body;
    const setLog = await prisma.workoutSetLog.create({
        data: {
            workoutExerciseLogId: req.params.id,
            setNumber,
            weight,
            reps,
            timeSeconds,
            completed: completed ?? false
        }
    });
    res.status(201).json(setLog);
};

export const updateSetLog = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const setLog = await prisma.workoutSetLog.findFirst({
        where: { id: req.params.id },
        include: { workoutExerciseLog: { include: { workoutSession: true } } }
    });
    if (!setLog || setLog.workoutExerciseLog.workoutSession.userId !== userId) {
        res.status(404).json({ error: 'Set not found' }); return;
    }
    const updated = await prisma.workoutSetLog.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
};

export const deleteSetLog = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const setLog = await prisma.workoutSetLog.findFirst({
        where: { id: req.params.id },
        include: { workoutExerciseLog: { include: { workoutSession: true } } }
    });
    if (!setLog || setLog.workoutExerciseLog.workoutSession.userId !== userId) {
        res.status(404).json({ error: 'Set not found' }); return;
    }
    await prisma.workoutSetLog.delete({ where: { id: req.params.id } });
    res.json({ success: true });
};

// ─── PERSONAL BESTS ───────────────────────────────────────────────────────────

export const getExerciseHistory = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { exerciseId } = req.params;

    const logs = await prisma.workoutExerciseLog.findMany({
        where: {
            exerciseId,
            workoutSession: { userId }
        },
        include: {
            sets: { orderBy: { setNumber: 'asc' } },
            workoutSession: { select: { date: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
    });
    res.json(logs);
};
