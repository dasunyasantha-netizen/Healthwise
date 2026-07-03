import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const SYSWISE_API = process.env.SYSWISE_API_URL || 'http://localhost:8000';

// Superuser "view as" support: verify the caller is a SysWise superuser and load the
// target user they want to preview. Both checks go through SysWise with the caller's
// own token, so a non-superuser can never obtain a preview session.
async function resolvePreviewTarget(ssoToken: string, previewUserId: unknown):
    Promise<{ target?: any; error?: { status: number; message: string } }> {
    const profileRes = await fetch(`${SYSWISE_API}/api/auth/profile/`, {
        headers: { Authorization: `Bearer ${ssoToken}` },
    });
    const profile: any = await profileRes.json().catch(() => null);
    if (!profileRes.ok || !profile?.is_superuser) {
        return { error: { status: 403, message: 'Only SysWise superusers can preview another account' } };
    }

    const targetId = parseInt(String(previewUserId), 10);
    if (isNaN(targetId)) {
        return { error: { status: 400, message: 'previewUserId must be an integer' } };
    }

    const targetRes = await fetch(`${SYSWISE_API}/api/auth/users/${targetId}/`, {
        headers: { Authorization: `Bearer ${ssoToken}` },
    });
    const target: any = await targetRes.json().catch(() => null);
    if (!targetRes.ok) {
        return { error: { status: targetRes.status, message: 'Could not load preview user' } };
    }
    return { target };
}

export const ssoLogin = async (req: Request, res: Response) => {
    const { token, syswise_token, syswiseUserId, phone, email, name, previewUserId, previewSaveChanges } = req.body;
    const ssoToken = token || syswise_token;

    try {
        if (!ssoToken) {
            res.status(400).json({ error: 'No token provided' });
            return;
        }

        let userId = syswiseUserId ? parseInt(String(syswiseUserId), 10) : null;
        if (!userId) {
            const payload = JSON.parse(Buffer.from(ssoToken.split('.')[1], 'base64').toString());
            userId = parseInt(String(payload.user_id || payload.id || '0'), 10) || null;
        }

        if (!userId || isNaN(userId)) {
            res.status(400).json({ error: 'Could not determine SysWise user ID' });
            return;
        }

        let effectiveUserId: number = userId;
        let userName = name || 'SysWise User';
        let userEmail = email || '';
        let userPhone = phone || '';
        let previewMode = false;
        let saveChanges = false;

        if (previewUserId) {
            const { target, error } = await resolvePreviewTarget(ssoToken, previewUserId);
            if (error) {
                res.status(error.status).json({ error: error.message });
                return;
            }
            effectiveUserId = target.id;
            userName = [target.first_name, target.last_name].filter(Boolean).join(' ') || target.username || 'SysWise User';
            userEmail = target.email || '';
            userPhone = target.phone || '';
            previewMode = true;
            saveChanges = Boolean(previewSaveChanges);
        }

        // In preview mode the session cache is NOT touched — writing the superuser's
        // token under the target's id would clobber the target's own session.
        if (!previewMode) {
            await prisma.session.upsert({
                where: { userId: effectiveUserId },
                update: { syswiseToken: ssoToken },
                create: { userId: effectiveUserId, syswiseToken: ssoToken },
            });
        }

        const hwToken = jwt.sign(
            { userId: effectiveUserId, previewMode, previewSaveChanges: saveChanges, syswiseToken: ssoToken },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.json({
            token: hwToken,
            user: { id: effectiveUserId, name: userName, email: userEmail, phone: userPhone }
        });
    } catch (error) {
        console.error('SSO login error:', error);
        res.status(500).json({ error: 'SSO login failed' });
    }
};
