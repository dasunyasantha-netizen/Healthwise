import { useState, useEffect, useCallback } from 'react';
import { VersionBanner } from './components/VersionBanner';
import { api } from './services/api';
import { ViewMode, User, DashboardData } from './types';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import WorkoutsView from './components/WorkoutsView';
import MealsView from './components/MealsView';
import HabitsView from './components/HabitsView';
import MeasurementsView from './components/MeasurementsView';
import CalendarView from './components/CalendarView';
import AuthScreen from './components/AuthScreen';

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [view, setView] = useState<ViewMode>('dashboard');
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dashLoading, setDashLoading] = useState(false);

    // Boot: check for token in URL or localStorage
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');

        if (urlToken) {
            localStorage.setItem('healthwise_token', urlToken);
            window.history.replaceState({}, '', window.location.pathname);
            bootstrapUser(urlToken);
        } else {
            const stored = localStorage.getItem('healthwise_token');
            const storedUser = localStorage.getItem('healthwise_user');
            if (stored && storedUser) {
                const base: User = JSON.parse(storedUser);
                setToken(stored);
                setUser(base);
                setLoading(false);
                // Refresh avatar silently
                api.user.profile().then((profile: any) => {
                    const updated: User = {
                        ...base,
                        avatarUrl: profile.avatarUrl || profile.avatar_url || base.avatarUrl,
                    };
                    setUser(updated);
                    localStorage.setItem('healthwise_user', JSON.stringify(updated));
                }).catch(() => {});
            } else {
                setLoading(false);
            }
        }
    }, []);

    const bootstrapUser = async (t: string) => {
        try {
            const payload = JSON.parse(atob(t.split('.')[1]));
            const storedUser = localStorage.getItem('healthwise_user');
            const base: User = storedUser
                ? JSON.parse(storedUser)
                : { id: payload.userId, name: 'User', email: '' };
            setToken(t);
            setUser(base);
            // Fetch profile in background to get avatarUrl
            api.user.profile().then((profile: any) => {
                const updated: User = {
                    ...base,
                    name: profile.name || base.name,
                    email: profile.email || base.email,
                    avatarUrl: profile.avatarUrl || profile.avatar_url || base.avatarUrl,
                };
                setUser(updated);
                localStorage.setItem('healthwise_user', JSON.stringify(updated));
            }).catch(() => {});
        } catch {
            logout();
        } finally {
            setLoading(false);
        }
    };

    const loadDashboard = useCallback(async () => {
        if (!token) return;
        setDashLoading(true);
        try {
            const data = await api.dashboard.get();
            setDashboard(data);
        } catch (e) {
            console.error('Dashboard load failed:', e);
        } finally {
            setDashLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token && view === 'dashboard') loadDashboard();
    }, [token, view, loadDashboard]);

    const logout = () => {
        localStorage.removeItem('healthwise_token');
        localStorage.removeItem('healthwise_user');
        setToken(null);
        setUser(null);
        setDashboard(null);
    };

    const handleViewChange = (v: ViewMode) => {
        setView(v);
    };

    if (loading) {
        return (
            <div className="loading-full">
                <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                <p style={{ color: 'var(--color-text-3)', fontSize: '0.875rem' }}>Loading HealthWise...</p>
            </div>
        );
    }

    if (!token || !user) {
        return <AuthScreen onLogin={(t, u) => {
            setToken(t);
            setUser(u);
            localStorage.setItem('healthwise_token', t);
            localStorage.setItem('healthwise_user', JSON.stringify(u));
        }} />;
    }

    return (
        <>
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
            <Header user={user} onLogout={logout} />
            <main style={{ flex: 1 }}>
                {view === 'dashboard'    && <Dashboard data={dashboard} loading={dashLoading} onRefresh={loadDashboard} onNavigate={handleViewChange} />}
                {view === 'workouts'     && <WorkoutsView />}
                {view === 'meals'        && <MealsView />}
                {view === 'habits'       && <HabitsView />}
                {view === 'measurements' && <MeasurementsView />}
                {view === 'calendar'     && <CalendarView />}
            </main>
            <BottomNav current={view} onChange={handleViewChange} />
        </div>
        <VersionBanner />
        </>
    );
}
