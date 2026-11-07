import type { NextFunction, Request, Response } from 'express';

/**
 * SysWise Support Access. A SysWise superuser opens a customer's account only through
 * a session started in SysWise (passkey, reason, 15 minutes, logged). The preview
 * carries that session's token and SysWise stays the judge of whether it still runs:
 * we re-ask at most every 30 seconds, end the preview when SysWise says it ended or
 * can't be reached, and report every change made during it.
 *
 * The same file is used by every Pickiti app; only the app id passed in differs.
 */

const syswiseApi = () => (process.env.SYSWISE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const RECHECK_MS = 30_000;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Kept in the app's own token for a preview. */
export interface SupportClaim {
    token: string;
    sessionId: number;
    adminName: string;
    exp: number;
}

type Refusal = { status: number; error: string };

async function call(path: 'check' | 'record', body: Record<string, unknown>): Promise<any | 'unreachable'> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8000);
    try {
        const res = await fetch(`${syswiseApi()}/api/support/access/token/${path}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: abort.signal,
        });
        if (res.status >= 500) return 'unreachable';
        return await res.json().catch(() => null);
    } catch {
        return 'unreachable';
    } finally {
        clearTimeout(timer);
    }
}

/**
 * At sign-in: the support token must belong to a running session for this app and
 * this customer. Returns what to keep in the app token and how long it may live.
 */
export async function verifySupportToken(
    app: string,
    supportToken: unknown,
    targetUserId: number,
): Promise<{ claim: SupportClaim; allowChanges: boolean; expiresIn: number } | Refusal> {
    if (typeof supportToken !== 'string' || !supportToken) {
        return { status: 403, error: 'Start Support Access in SysWise to open this account.' };
    }
    const data = await call('check', { supportToken, app });
    if (data === 'unreachable') {
        return { status: 503, error: 'Support access cannot be checked right now. Please try again shortly.' };
    }
    const exp = Math.floor(new Date(data?.expiresAt).getTime() / 1000);
    const expiresIn = exp - Math.floor(Date.now() / 1000);
    if (!data?.active || Number(data.targetUserId) !== targetUserId || !(expiresIn > 0)) {
        return { status: 403, error: 'This support session has ended or is for another account.' };
    }
    return {
        claim: { token: supportToken, sessionId: Number(data.id), adminName: String(data.adminName || ''), exp },
        allowChanges: Boolean(data.allowChanges),
        expiresIn,
    };
}

export const isSupportRefusal = (result: object): result is Refusal => 'error' in result;

const checkedAt = new Map<string, number>();

function ended(res: Response) {
    res.status(401).json({ error: 'Support access has ended.', code: 'support_ended' });
}

/**
 * Every request made with a preview token. A preview from before Support Access
 * (no claim) is refused, so old "view as" tokens stop working.
 */
export async function guardSupportRequest(
    app: string,
    claim: SupportClaim | undefined,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    if (!claim?.token || claim.exp * 1000 <= Date.now()) {
        ended(res);
        return;
    }
    if (Date.now() - (checkedAt.get(claim.token) ?? 0) > RECHECK_MS) {
        const data = await call('check', { supportToken: claim.token, app });
        if (data === 'unreachable' || !data?.active) {
            checkedAt.delete(claim.token);
            ended(res);
            return;
        }
        if (checkedAt.size > 500) checkedAt.clear();
        checkedAt.set(claim.token, Date.now());
    }
    if (WRITE_METHODS.has(req.method)) {
        res.on('finish', () => {
            if (res.statusCode >= 400) return;
            void call('record', {
                supportToken: claim.token,
                app,
                method: req.method,
                path: req.originalUrl.split('?')[0],
                statusCode: res.statusCode,
            });
        });
    }
    next();
}
