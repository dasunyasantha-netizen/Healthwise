/**
 * Who is signing in, as SysWise says. The app never takes a user id from the request
 * body or from a token it decoded itself: anyone could send those. If SysWise can't
 * be reached we fail closed and issue no session.
 */

const syswiseApi = () => (process.env.SYSWISE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface SyswiseProfile {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string;
    isSuperuser: boolean;
}

type Refusal = { status: number; error: string };

export async function verifySyswiseIdentity(app: string, token: unknown): Promise<SyswiseProfile | Refusal> {
    if (typeof token !== 'string' || !token) return { status: 400, error: 'No token provided' };
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 8000);
    let res: Response;
    try {
        res = await fetch(`${syswiseApi()}/api/auth/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: abort.signal,
        });
    } catch {
        return { status: 503, error: 'Sign-in is temporarily unavailable. Please try again shortly.' };
    } finally {
        clearTimeout(timer);
    }
    if (res.status === 401 || res.status === 403) {
        return { status: 401, error: 'Your session is invalid. Please sign in to SysWise again.' };
    }
    const data: any = res.ok ? await res.json().catch(() => null) : null;
    if (!data || !Number.isInteger(data.id) || data.id <= 0) {
        return { status: 503, error: 'Sign-in is temporarily unavailable. Please try again shortly.' };
    }
    if (Array.isArray(data.app_restrictions) && data.app_restrictions.includes(app)) {
        return { status: 403, error: 'You do not have access to this app. Contact your administrator.' };
    }
    return {
        id: data.id,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
        isSuperuser: Boolean(data.is_superuser),
    };
}

export const isIdentityRefusal = (result: object): result is Refusal => 'error' in result;
