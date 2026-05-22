import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

export const ssoLogin = async (req: Request, res: Response) => {
    const { token, syswise_token, syswiseUserId, phone, email, name } = req.body;
    const ssoToken = token || syswise_token;

    try {
        if (!ssoToken) {
            res.status(400).json({ error: 'No token provided' });
            return;
        }

        let userId = syswiseUserId ? parseInt(syswiseUserId, 10) : null;
        if (!userId) {
            const payload = JSON.parse(Buffer.from(ssoToken.split('.')[1], 'base64').toString());
            userId = payload.user_id || payload.id || null;
        }

        if (!userId || isNaN(userId)) {
            res.status(400).json({ error: 'Could not determine SysWise user ID' });
            return;
        }

        await prisma.session.upsert({
            where: { userId },
            update: { syswiseToken: ssoToken },
            create: { userId, syswiseToken: ssoToken },
        });

        const hwToken = jwt.sign(
            { userId, syswiseToken: ssoToken },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.json({
            token: hwToken,
            user: { id: userId, name: name || 'SysWise User', email: email || '', phone: phone || '' }
        });
    } catch (error) {
        console.error('SSO login error:', error);
        res.status(500).json({ error: 'SSO login failed' });
    }
};
