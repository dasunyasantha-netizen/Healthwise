import { useState, useEffect } from 'react';
import { Timer, Play, Square } from 'lucide-react';
import { FastingSession } from '../types';
import { api } from '../services/api';

interface Props {
    session: FastingSession | null;
    onNavigate: () => void;
}

function formatDuration(ms: number) {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function FastingTimerCard({ session, onNavigate }: Props) {
    const [elapsed, setElapsed] = useState(0);
    const [active, setActive] = useState<FastingSession | null>(session);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        setActive(session);
    }, [session]);

    useEffect(() => {
        if (!active || active.status !== 'active') return;
        const tick = () => {
            const start = new Date(active.startTime).getTime();
            setElapsed(Date.now() - start);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [active]);

    const targetMs = active ? active.targetHours * 3600000 : 16 * 3600000;
    const pct = active ? Math.min(elapsed / targetMs, 1) : 0;

    // svg ring
    const size = 100;
    const stroke = 7;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct);

    const handleStart = async () => {
        setStarting(true);
        try {
            const s = await api.fasting.start({ targetHours: 16 });
            setActive(s);
        } catch (e) {
            console.error(e);
        } finally {
            setStarting(false);
        }
    };

    const handleEnd = async () => {
        if (!active) return;
        try {
            await api.fasting.end(active.id);
            setActive(null);
            setElapsed(0);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Timer size={18} color="#8b5cf6" />
                <span style={{ fontWeight: 700 }}>Fasting</span>
                {active && <span className="badge badge-purple">Active</span>}
            </div>

            {active ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                            <circle fill="none" stroke="var(--color-border)" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} />
                            <circle fill="none" stroke="#8b5cf6" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
                                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s linear' }} />
                        </svg>
                        <div style={{
                            position: 'absolute', inset: 0, display: 'flex',
                            flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#8b5cf6' }}>
                                {Math.round(pct * 100)}%
                            </span>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                            {formatDuration(elapsed)}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', marginTop: 4 }}>
                            Goal: {active.targetHours}h fast
                        </div>
                        {pct >= 1 && (
                            <div style={{ marginTop: 6, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                                Goal reached! Great work.
                            </div>
                        )}
                        <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }} onClick={handleEnd}>
                            <Square size={13} /> End Fast
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-2)' }}>No active fast</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>Start a 16-hour fast now</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-sm" style={{ background: '#ede9fe', color: '#5b21b6', border: 'none' }}
                            onClick={handleStart} disabled={starting}>
                            <Play size={13} /> Start Fast
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={onNavigate}>All</button>
                    </div>
                </div>
            )}
        </div>
    );
}
