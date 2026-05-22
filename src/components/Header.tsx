import { Activity, LogOut, Home } from 'lucide-react';
import { User } from '../types';

interface Props {
    user: User;
    onLogout: () => void;
}

const getSyswiseUrl = () => {
    if (typeof window === 'undefined') return 'https://syswise.lk';
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:3100' : 'https://syswise.lk';
};

export default function Header({ user, onLogout }: Props) {
    return (
        <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Activity size={18} color="#fff" strokeWidth={2.5} />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2 }}>HealthWise</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-3)', lineHeight: 1 }}>
                        Hi, {user.name.split(' ')[0]}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <a href={getSyswiseUrl()} className="btn btn-ghost btn-icon" title="Back to SysWise">
                    <Home size={18} />
                </a>
                <button className="btn btn-ghost btn-icon" onClick={onLogout} title="Sign out">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
}
