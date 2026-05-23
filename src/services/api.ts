const getBaseUrl = () => {
    if (typeof window === 'undefined') return '';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:4500/api' : '/healthwise-api/api';
};

const getToken = () => localStorage.getItem('healthwise_token');

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = getToken();
    const res = await fetch(`${getBaseUrl()}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
}

const get  = <T>(path: string) => request<T>('GET', path);
const post = <T>(path: string, body: unknown) => request<T>('POST', path, body);
const put  = <T>(path: string, body: unknown) => request<T>('PUT', path, body);
const del  = <T>(path: string) => request<T>('DELETE', path);

export const api = {
    auth: {
        ssoLogin: (data: { token: string; phone?: string; email?: string; name?: string }) =>
            post<{ token: string; user: any }>('/auth/sso-login', data),
    },

    user: {
        profile: () => get<any>('/user/profile'),
    },

    dashboard: {
        get: () => get<any>('/dashboard'),
        weekly: () => get<any>('/dashboard/weekly'),
    },

    exercises: {
        list: (params?: { category?: string; search?: string }) => {
            const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
            return get<any[]>(`/exercises${qs}`);
        },
        get:    (id: string)   => get<any>(`/exercises/${id}`),
        create: (data: unknown) => post<any>('/exercises', data),
        update: (id: string, data: unknown) => put<any>(`/exercises/${id}`, data),
        delete: (id: string)   => del<any>(`/exercises/${id}`),
    },

    workouts: {
        plans: {
            list:      ()              => get<any[]>('/workouts/plans'),
            get:       (id: string)    => get<any>(`/workouts/plans/${id}`),
            create:    (data: unknown) => post<any>('/workouts/plans', data),
            update:    (id: string, data: unknown) => put<any>(`/workouts/plans/${id}`, data),
            delete:    (id: string)    => del<any>(`/workouts/plans/${id}`),
            duplicate: (id: string, data: unknown) => post<any>(`/workouts/plans/${id}/duplicate`, data),
        },
        sessions: {
            list:       ()              => get<any[]>('/workouts/sessions'),
            byDate:     (date: string)  => get<any[]>(`/workouts/sessions/date/${date}`),
            create:     (data: unknown) => post<any>('/workouts/sessions', data),
            update:     (id: string, data: unknown) => put<any>(`/workouts/sessions/${id}`, data),
            complete:   (id: string)    => post<any>(`/workouts/sessions/${id}/complete`, {}),
            delete:     (id: string)    => del<any>(`/workouts/sessions/${id}`),
            addLog:     (id: string, data: unknown) => post<any>(`/workouts/sessions/${id}/exercise-logs`, data),
        },
        exerciseLogs: {
            update: (id: string, data: unknown) => put<any>(`/workouts/exercise-logs/${id}`, data),
            addSet: (id: string, data: unknown) => post<any>(`/workouts/exercise-logs/${id}/sets`, data),
        },
        setLogs: {
            update: (id: string, data: unknown) => put<any>(`/workouts/set-logs/${id}`, data),
            delete: (id: string) => del<any>(`/workouts/set-logs/${id}`),
        },
        history: (exerciseId: string) => get<any[]>(`/workouts/history/${exerciseId}`),
    },

    meals: {
        list:     ()              => get<any[]>('/meals'),
        byDate:   (date: string)  => get<any[]>(`/meals/date/${date}`),
        create:   (data: unknown) => post<any>('/meals', data),
        update:   (id: string, data: unknown) => put<any>(`/meals/${id}`, data),
        delete:   (id: string)    => del<any>(`/meals/${id}`),
    },

    fasting: {
        list:   ()              => get<any[]>('/fasting'),
        active: ()              => get<any>('/fasting/active'),
        start:  (data: unknown) => post<any>('/fasting/start', data),
        end:    (id: string)    => post<any>(`/fasting/${id}/end`, {}),
        cancel: (id: string)    => post<any>(`/fasting/${id}/cancel`, {}),
    },

    habits: {
        list:       ()              => get<any[]>('/habits'),
        byDate:     (date: string)  => get<any[]>(`/habits/date/${date}`),
        create:     (data: unknown) => post<any>('/habits', data),
        update:     (id: string, data: unknown) => put<any>(`/habits/${id}`, data),
        delete:     (id: string)    => del<any>(`/habits/${id}`),
        complete:   (id: string, data: unknown) => post<any>(`/habits/${id}/complete`, data),
        uncomplete: (id: string, data: unknown) => post<any>(`/habits/${id}/uncomplete`, data),
        stats:      (id: string)    => get<any>(`/habits/${id}/stats`),
    },

    measurements: {
        list:   ()              => get<any[]>('/measurements'),
        latest: ()              => get<any>('/measurements/latest'),
        trends: ()              => get<any[]>('/measurements/trends'),
        create: (data: unknown) => post<any>('/measurements', data),
        update: (id: string, data: unknown) => put<any>(`/measurements/${id}`, data),
        delete: (id: string)    => del<any>(`/measurements/${id}`),
    },

    calendar: {
        month: (year: number, month: number) => get<any>(`/calendar/month?year=${year}&month=${month}`),
        day:   (date: string) => get<any>(`/calendar/day/${date}`),
    },
};
