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
