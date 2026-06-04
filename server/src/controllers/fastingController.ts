import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getFastingSessions = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const sessions = await prisma.fastingSession.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' }
    });
    res.json(sessions);
};

export const getActiveFasting = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const session = await prisma.fastingSession.findFirst({
        where: { userId, status: 'active' },
        orderBy: { startTime: 'desc' }
    });
    res.json(session || null);
};

export const startFasting = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    // Cancel any existing active session
    await prisma.fastingSession.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'cancelled' }
    });

    const { targetHours, notes, startTime } = req.body;
    const session = await prisma.fastingSession.create({
        data: {
            userId,
            startTime: startTime ? new Date(startTime) : new Date(),
            targetHours: targetHours || 16,
            status: 'active',
            notes
        }
    });
    res.status(201).json(session);
};

export const endFasting = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.fastingSession.findFirst({
        where: { id: req.params.id, userId }
    });
    if (!existing) { res.status(404).json({ error: 'Fasting session not found' }); return; }

    const session = await prisma.fastingSession.update({
        where: { id: req.params.id },
        data: {
            endTime: new Date(),
            status: 'completed'
        }
    });
    res.json(session);
};

export const cancelFasting = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.fastingSession.findFirst({
        where: { id: req.params.id, userId }
    });
    if (!existing) { res.status(404).json({ error: 'Fasting session not found' }); return; }

    const session = await prisma.fastingSession.update({
        where: { id: req.params.id },
        data: { status: 'cancelled' }
    });
    res.json(session);
};

export const deleteFasting = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.fastingSession.findFirst({
        where: { id: req.params.id, userId }
    });
    if (!existing) { res.status(404).json({ error: 'Fasting session not found' }); return; }
    await prisma.fastingSession.delete({ where: { id: req.params.id } });
    res.json({ success: true });
};
