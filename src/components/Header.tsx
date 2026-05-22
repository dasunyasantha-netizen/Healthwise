import { Activity, LogOut } from 'lucide-react';
import { User } from '../types';

interface Props {
    user: User;
    onLogout: () => void;
}

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

            <button className="btn btn-ghost btn-icon" onClick={onLogout} title="Sign out">
                <LogOut size={18} />
            </button>
        </header>
    );
}
