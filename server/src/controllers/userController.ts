import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

const SYSWISE_API = process.env.SYSWISE_API_URL || 'http://localhost:8100';

export const getProfile = async (req: AuthRequest, res: Response) => {
    const syswiseToken = req.user?.syswiseToken;
    if (!syswiseToken) return res.status(401).json({ error: 'No SysWise token — please log in again' });
    try {
        const upstream = await fetch(`${SYSWISE_API}/api/auth/profile/`, {
            headers: { Authorization: `Bearer ${syswiseToken}` },
        });
        const data = await upstream.json();
        res.status(upstream.ok ? 200 : upstream.status).json(data);
    } catch {
        res.status(502).json({ error: 'Could not reach SysWise API' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
    const syswiseToken = req.user?.syswiseToken;
    if (!syswiseToken) return res.status(401).json({ error: 'No SysWise token — please log in again' });
    try {
        const upstream = await fetch(`${SYSWISE_API}/api/auth/profile/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${syswiseToken}` },
            body: JSON.stringify(req.body),
        });
        const data = await upstream.json();
        res.status(upstream.ok ? 200 : upstream.status).json(data);
    } catch {
        res.status(502).json({ error: 'Could not reach SysWise API' });
    }
};
