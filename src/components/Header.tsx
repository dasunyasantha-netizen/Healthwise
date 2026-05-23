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

function Avatar({ user }: { user: User }) {
    const initials = user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');

    if (user.avatarUrl) {
        return (
            <img
                src={user.avatarUrl}
                alt={user.name}
                style={{
                    width: 34, height: 34, borderRadius: '50%',
                    objectFit: 'cover', border: '2px solid var(--color-border-light)',
                    flexShrink: 0
                }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
        );
    }

    return (
        <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'var(--color-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '.02em'
        }}>
            {initials || '?'}
        </div>
    );
}

export default function Header({ user, onLogout }: Props) {
    return (
        <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar user={user} />
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
