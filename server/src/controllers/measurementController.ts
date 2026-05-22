import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { differenceInDays, parseISO } from 'date-fns';

export const getMeasurements = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const measurements = await prisma.healthMeasurement.findMany({
        where: { userId },
        orderBy: { date: 'desc' }
    });
    res.json(measurements);
};

export const getLatestMeasurement = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const measurement = await prisma.healthMeasurement.findFirst({
        where: { userId },
        orderBy: { date: 'desc' }
    });

    if (!measurement) {
        res.json({ measurement: null, status: 'none', message: 'Add your first measurement' });
        return;
    }

    const today = new Date();
    const measurementDate = parseISO(measurement.date);
    const daysSince = differenceInDays(today, measurementDate);
    const dueIn = 14 - daysSince;

    res.json({
        measurement,
        daysSince,
        status: daysSince >= 14 ? 'overdue' : 'ok',
        dueIn: dueIn > 0 ? dueIn : 0,
        overdueDays: daysSince >= 14 ? daysSince - 14 : 0,
        message: daysSince >= 14
            ? `Measurement update overdue by ${daysSince - 14} day${daysSince - 14 !== 1 ? 's' : ''}`
            : `Next measurement due in ${dueIn} day${dueIn !== 1 ? 's' : ''}`
    });
};

export const createMeasurement = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const data = { ...req.body };

    // Auto-calculate BMI if weight and height are available
    if (data.weight && !data.bmi) {
        const settings = await prisma.settings.findUnique({ where: { userId } });
        const height = data.height || settings?.height;
        if (height) {
            const heightM = height / 100;
            data.bmi = parseFloat((data.weight / (heightM * heightM)).toFixed(1));
        }
    }

    // Store height on settings if provided
    if (data.height) {
        await prisma.settings.upsert({
            where: { userId },
            update: { height: data.height },
            create: { userId, height: data.height },
        });
    }

    const measurement = await prisma.healthMeasurement.create({
        data: { userId, ...data }
    });
    res.status(201).json(measurement);
};

export const updateMeasurement = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.healthMeasurement.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Measurement not found' }); return; }
    const measurement = await prisma.healthMeasurement.update({ where: { id: req.params.id }, data: req.body });
    res.json(measurement);
};

export const deleteMeasurement = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.healthMeasurement.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Measurement not found' }); return; }
    await prisma.healthMeasurement.delete({ where: { id: req.params.id } });
    res.json({ success: true });
};

export const getMeasurementTrends = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const measurements = await prisma.healthMeasurement.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        take: 50
    });
    res.json(measurements);
};
