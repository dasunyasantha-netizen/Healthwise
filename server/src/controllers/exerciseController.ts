import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getExercises = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { category, search } = req.query;

    const where: any = {
        OR: [
            { isSystem: true },
            { createdByUserId: userId }
        ]
    };

    if (category) where.category = category as string;
    if (search) {
        where.AND = [{
            OR: [
                { name: { contains: search as string, mode: 'insensitive' } },
                { primaryMuscle: { contains: search as string, mode: 'insensitive' } },
                { bodyPartFocus: { contains: search as string, mode: 'insensitive' } }
            ]
        }];
    }

    const exercises = await prisma.exercise.findMany({
        where,
        orderBy: [{ isSystem: 'desc' }, { category: 'asc' }, { name: 'asc' }]
    });
    res.json(exercises);
};

export const getExercise = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const exercise = await prisma.exercise.findFirst({
        where: {
            id,
            OR: [{ isSystem: true }, { createdByUserId: userId }]
        }
    });

    if (!exercise) { res.status(404).json({ error: 'Exercise not found' }); return; }
    res.json(exercise);
};

export const createExercise = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const {
        name, category, primaryMuscle, secondaryMuscles, bodyPartFocus,
        equipment, trackingType, demoVideoUrl, sourceUrl, instructions, safetyNotes
    } = req.body;

    const exercise = await prisma.exercise.create({
        data: {
            name, category, primaryMuscle,
            secondaryMuscles: secondaryMuscles || [],
            bodyPartFocus, equipment, trackingType,
            demoVideoUrl, sourceUrl, instructions, safetyNotes,
            isSystem: false,
            createdByUserId: userId
        }
    });
    res.status(201).json(exercise);
};

export const updateExercise = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.exercise.findFirst({
        where: { id, createdByUserId: userId, isSystem: false }
    });
    if (!existing) { res.status(404).json({ error: 'Exercise not found or not editable' }); return; }

    const exercise = await prisma.exercise.update({
        where: { id },
        data: req.body
    });
    res.json(exercise);
};

export const deleteExercise = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.exercise.findFirst({
        where: { id, createdByUserId: userId, isSystem: false }
    });
    if (!existing) { res.status(404).json({ error: 'Exercise not found or not deletable' }); return; }

    await prisma.exercise.delete({ where: { id } });
    res.json({ success: true });
};

// ─── EXERCISE NOTES ──────────────────────────────────────────────────────────

export const getExerciseNotes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = parseInt(String(req.user!.userId), 10);
        const notes = await prisma.exerciseNote.findMany({
            where: { exerciseId: req.params.id, userId },
            orderBy: { date: 'desc' }
        });
        res.json(notes);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const createExerciseNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = parseInt(String(req.user!.userId), 10);
        const { note, date } = req.body;
        const created = await prisma.exerciseNote.create({
            data: { userId, exerciseId: req.params.id, note, date }
        });
        res.status(201).json(created);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const deleteExerciseNote = async (req: AuthRequest, res: Response) => {
    try {
        const userId = parseInt(String(req.user!.userId), 10);
        const existing = await prisma.exerciseNote.findFirst({ where: { id: req.params.noteId, userId } });
        if (!existing) { res.status(404).json({ error: 'Note not found' }); return; }
        await prisma.exerciseNote.delete({ where: { id: req.params.noteId } });
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};
