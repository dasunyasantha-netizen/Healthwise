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

    // Preview tokens (superuser "view as") carry the superuser's own SysWise token and
    // must not read the target's session — it may be stale or absent entirely.
    if (decoded.previewMode) {
        req.user = { userId, syswiseToken: decoded.syswiseToken };
        next();
        return;
    }

    // Always read fresh syswiseToken from DB — the one embedded in the JWT is stale after re-login
    const session = await prisma.session.findUnique({ where: { userId } });
    req.user = { userId, syswiseToken: session?.syswiseToken ?? decoded.syswiseToken };
    next();
};

// Blocks mutating requests made with a read-only preview token (SysWise superuser
// "view as" with Save changes off). Decodes the bearer token itself so it can be
// mounted app-wide ahead of the per-route auth middleware.
export const blockReadOnlyPreviewWrites = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        next();
        return;
    }
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        next(); // unauthenticated routes (login/SSO) are never previews
        return;
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        if (payload.previewMode && !payload.previewSaveChanges) {
            res.status(403).json({ error: 'Preview is read-only. Enable "Save changes" to modify this account.' });
            return;
        }
    } catch { /* invalid token — the route's own auth will reject it */ }
    next();
};
