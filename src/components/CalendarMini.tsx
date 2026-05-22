import { useState, useEffect } from 'react';
import { format, startOfMonth, getDaysInMonth, getDay } from 'date-fns';
import { api } from '../services/api';

interface Props {
    onNavigate: () => void;
}

export default function CalendarMini({ onNavigate }: Props) {
    const [calData, setCalData] = useState<Record<string, any>>({});
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const todayStr = format(now, 'yyyy-MM-dd');
    const daysInMonth = getDaysInMonth(now);
    const firstDow = getDay(startOfMonth(now));

    useEffect(() => {
        api.calendar.month(year, month)
            .then(r => setCalData(r.days || {}))
            .catch(() => {});
    }, [year, month]);

    const DOT_COLORS: Record<string, string> = {
        hasWorkout: '#0073ea',
        hasMeal: '#f59e0b',
        hasFasting: '#579bfc',
        hasHabit: '#00c875',
        hasMeasurement: '#06b6d4',
    };

    return (
        <div className="card card-compact" onClick={onNavigate} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
                {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', padding: '2px 0' }}>{d}</div>
                ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                    const info = calData[dateStr];
                    const isToday = dateStr === todayStr;
                    const dots = info ? Object.entries(DOT_COLORS).filter(([k]) => info[k]) : [];

                    return (
                        <div key={d} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', padding: '3px 0', borderRadius: 'var(--radius-md)',
                            background: isToday ? 'var(--color-primary)' : 'transparent',
                            minHeight: 28,
                        }}>
                            <span style={{
                                fontSize: '0.75rem', fontWeight: isToday ? 700 : 500,
                                color: isToday ? '#fff' : 'var(--color-text)',
                                lineHeight: 1
                            }}>{d}</span>
                            {dots.length > 0 && (
                                <div style={{ display: 'flex', gap: 1.5, marginTop: 2 }}>
                                    {dots.slice(0,3).map(([k, c]) => (
                                        <div key={k} style={{ width: 3, height: 3, borderRadius: '50%', background: isToday ? 'rgba(255,255,255,.7)' : c }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
