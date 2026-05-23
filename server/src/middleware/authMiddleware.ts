import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

export interface AuthRequest extends Request {
    user?: { userId: number; syswiseToken?: string };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.sendStatus(401);
        return;
    }

    let decoded: any;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
        res.sendStatus(403);
        return;
    }

    const userId = decoded.userId as number;

    // Always read fresh syswiseToken from DB — the one embedded in the JWT is stale after re-login
    const session = await prisma.session.findUnique({ where: { userId } });
    req.user = { userId, syswiseToken: session?.syswiseToken ?? decoded.syswiseToken };
    next();
};
