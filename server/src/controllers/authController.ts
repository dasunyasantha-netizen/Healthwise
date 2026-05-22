import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

export const ssoLogin = async (req: Request, res: Response) => {
    const { token, syswise_token, phone, email, name } = req.body;
    const ssoToken = token || syswise_token;

    try {
        if (!ssoToken) {
            res.status(400).json({ error: 'No token provided' });
            return;
        }

        const identifier = phone || email;
        if (!identifier) {
            res.status(400).json({ error: 'No identifier provided' });
            return;
        }

        let user = await prisma.user.findFirst({
            where: {
                OR: [
                    { phone: phone || undefined },
                    { email: email || undefined }
                ]
            }
        });

        if (!user) {
            const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
            user = await prisma.user.create({
                data: {
                    email: email || `${phone}@syswise.local`,
                    phone: phone || null,
                    name: name || 'SysWise User',
                    handle: (phone || email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9]/g, ''),
                    password: randomPassword,
                },
            });
        }

        const hwToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.json({
            token: hwToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                handle: user.handle,
                avatarUrl: user.avatarUrl,
                height: user.height,
            }
        });
    } catch (error) {
        console.error('SSO login error:', error);
        res.status(500).json({ error: 'SSO login failed' });
    }
};
