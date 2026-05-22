import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';

export const getMeals = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const meals = await prisma.mealLog.findMany({
        where: { userId },
        orderBy: [{ date: 'desc' }, { time: 'asc' }]
    });
    res.json(meals);
};

export const getMealsByDate = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const meals = await prisma.mealLog.findMany({
        where: { userId, date: req.params.date },
        orderBy: { time: 'asc' }
    });
    res.json(meals);
};

export const createMeal = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const meal = await prisma.mealLog.create({
        data: { userId, ...req.body }
    });
    res.status(201).json(meal);
};

export const updateMeal = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.mealLog.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Meal not found' }); return; }
    const meal = await prisma.mealLog.update({ where: { id: req.params.id }, data: req.body });
    res.json(meal);
};

export const deleteMeal = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const existing = await prisma.mealLog.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) { res.status(404).json({ error: 'Meal not found' }); return; }
    await prisma.mealLog.delete({ where: { id: req.params.id } });
    res.json({ success: true });
};
