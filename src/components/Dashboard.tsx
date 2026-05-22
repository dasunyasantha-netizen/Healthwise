import { useEffect, useState } from 'react';
import { RefreshCw, Dumbbell, UtensilsCrossed, Timer, Ruler, Flame, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { DashboardData, HealthMeasurement, ViewMode } from '../types';
import FastingTimerCard from './FastingTimerCard';
import CalendarMini from './CalendarMini';
import { api } from '../services/api';

interface Props {
    data: DashboardData | null;
    loading: boolean;
    onRefresh: () => void;
    onNavigate: (v: ViewMode) => void;
}

function ProgressRing({ value, max, size = 64, stroke = 6, color = 'var(--color-primary)' }: {
    value: number; max: number; size?: number; stroke?: number; color?: string;
}) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const pct = max > 0 ? Math.min(value / max, 1) : 0;
    const offset = circ * (1 - pct);
    return (
        <svg width={size} height={size} className="ring-svg">
            <circle className="ring-track" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} />
            <circle className="ring-fill" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
                stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
    );
}

function MiniChart({ data, dataKey, color, label, unit, referenceVal }: {
    data: any[]; dataKey: string; color: string; label: string; unit: string; referenceVal?: number;
}) {
    if (!data || data.length < 2) return null;
    const values = data.map(d => d[dataKey]).filter(v => v != null);
    if (values.length < 2) return null;
    const latest = values[values.length - 1];
    const prev = values[values.length - 2];
    const diff = latest - prev;
    const diffStr = (diff > 0 ? '+' : '') + diff.toFixed(1);
    const diffColor = diff === 0 ? 'var(--color-text-3)' : (diff > 0 ? '#ef4444' : '#00c875');

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{latest}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{unit}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: diffColor }}>{diffStr}</span>
                    </div>
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-3)' }}>
                    {data.length} entries
                </div>
            </div>
            <ResponsiveContainer width="100%" height={72}>
                <LineChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-3)' }}
                        tickFormatter={d => d ? d.slice(5) : ''} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} domain={['auto', 'auto']} />
                    {referenceVal && <ReferenceLine y={referenceVal} stroke={color} strokeDasharray="4 3" strokeOpacity={0.4} />}
                    <Tooltip
                        contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-border-light)' }}
                        labelFormatter={l => l ? String(l).replace(/-/g, '/') : ''}
                        formatter={(v: any) => [`${v} ${unit}`, label]}
                    />
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5}
                        dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function BmiGauge({ bmi }: { bmi: number }) {
    const zones = [
        { label: 'Under', max: 18.5, color: '#60a5fa' },
        { label: 'Normal', max: 25, color: '#00c875' },
        { label: 'Over', max: 30, color: '#f59e0b' },
        { label: 'Obese', max: 40, color: '#ef4444' },
    ];
    const clamp = Math.min(Math.max(bmi, 14), 40);
    const pct = ((clamp - 14) / (40 - 14)) * 100;
    const zone = zones.find(z => bmi < z.max) ?? zones[zones.length - 1];

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px 12px' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>BMI</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
                <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{bmi.toFixed(1)}</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: zone.color }}>{zone.label}</span>
            </div>
            <div style={{ position: 'relative', height: 10, borderRadius: 6, overflow: 'hidden', background: 'linear-gradient(to right, #60a5fa 0%, #00c875 35%, #f59e0b 65%, #ef4444 100%)' }}>
                <div style={{
                    position: 'absolute', top: -2, left: `${pct}%`, transform: 'translateX(-50%)',
                    width: 14, height: 14, borderRadius: '50%',
                    background: '#fff', border: `3px solid ${zone.color}`,
                    boxShadow: '0 1px 4px rgba(0,0,0,.2)'
                }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {['14', '18.5', '25', '30', '40'].map(v => (
                    <span key={v} style={{ fontSize: '0.625rem', color: 'var(--color-text-3)' }}>{v}</span>
                ))}
            </div>
        </div>
    );
}

function BpCard({ systolic, diastolic }: { systolic: number; diastolic: number }) {
    const classify = () => {
        if (systolic < 120 && diastolic < 80) return { label: 'Normal', color: '#00c875' };
        if (systolic < 130 && diastolic < 80) return { label: 'Elevated', color: '#f59e0b' };
        if (systolic < 140 || diastolic < 90) return { label: 'High Stage 1', color: '#f97316' };
        return { label: 'High Stage 2', color: '#ef4444' };
    };
    const { label, color } = classify();
    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Blood Pressure</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{systolic}</span>
                    <span style={{ fontSize: '1rem', color: 'var(--color-text-3)' }}>/</span>
                    <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{diastolic}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>mmHg</span>
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color, background: `${color}18`, padding: '3px 10px', borderRadius: 20 }}>{label}</span>
            </div>
        </div>
    );
}

export default function Dashboard({ data, loading, onRefresh, onNavigate }: Props) {
    const today = format(new Date(), 'EEEE, MMMM d');
    const [trends, setTrends] = useState<any[]>([]);

    useEffect(() => {
        api.measurements.trends().then((t: HealthMeasurement[]) => {
            setTrends(t.map(m => ({
                date: m.date,
                weight: m.weight ?? null,
                waist: m.waist ?? null,
                bodyFat: m.bodyFatPercentage ?? null,
                systolic: m.systolicBp ?? null,
                diastolic: m.diastolicBp ?? null,
                hr: m.restingHeartRate ?? null,
            })));
        }).catch(() => {});
    }, []);

    if (loading && !data) {
        return (
            <div className="page">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                    {[1,2,3,4].map(i => (
                        <div key={i} style={{
                            height: 100, borderRadius: 'var(--radius-2xl)',
                            background: 'var(--color-border-light)',
                            animation: 'pulse 1.5s ease-in-out infinite'
                        }} />
                    ))}
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
            </div>
        );
    }

    const meals = data?.meals;
    const habits = data?.habits;
    const measurement = data?.measurement;
    const workouts = data?.workouts;
    const fasting = data?.fasting;
    const latest = measurement?.latest;

    const motivationalMsg = (() => {
        if (!data) return "Let's make today count!";
        const score = habits?.score || 0;
        const wc = data.weeklyWorkoutCount || 0;
        if (score >= 80 && wc >= 4) return "You're on fire! Incredible consistency this week.";
        if (score >= 60) return "Great momentum! Keep pushing — you're building something real.";
        if (wc >= 3) return "Strong week of training. Your body is thanking you.";
        if (habits?.total === 0) return "Add your first habit and start building your streak today.";
        return "Every rep, every meal, every day — it all adds up. Let's go!";
    })();

    const hasCharts = trends.length >= 2;

    return (
        <div className="page">
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>{today}</div>
                    <h2 style={{ marginTop: 2 }}>Your Day</h2>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={onRefresh} title="Refresh">
                    <RefreshCw size={18} style={loading ? { animation: 'spin .7s linear infinite' } : {}} />
                </button>
            </div>

            {/* Motivational banner */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
                color: '#fff', marginBottom: 16, padding: '16px 20px',
                border: 'none', boxShadow: '0 4px 16px rgba(0,115,234,.25)'
            }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.5 }}>{motivationalMsg}</p>
            </div>

            {/* Quick actions */}
            <div style={{ marginBottom: 20 }}>
                <div className="section-title">Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                        { icon: Dumbbell, label: 'Workout', view: 'workouts' as ViewMode, color: '#3b82f6' },
                        { icon: UtensilsCrossed, label: 'Meal', view: 'meals' as ViewMode, color: '#f59e0b' },
                        { icon: Timer, label: 'Fast', view: 'meals' as ViewMode, color: '#8b5cf6' },
                        { icon: Ruler, label: 'Measure', view: 'measurements' as ViewMode, color: '#06b6d4' },
                    ].map(a => (
                        <button key={a.label} onClick={() => onNavigate(a.view)}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                gap: 6, padding: '12px 6px', borderRadius: 'var(--radius-xl)',
                                background: 'var(--color-surface)', border: '1.5px solid var(--color-border-light)',
                                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.6875rem',
                                fontWeight: 600, color: 'var(--color-text-2)', transition: 'all .15s'
                            }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 'var(--radius-lg)',
                                background: `${a.color}18`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <a.icon size={18} color={a.color} strokeWidth={2} />
                            </div>
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fasting timer */}
            <div style={{ marginBottom: 16 }}>
                <FastingTimerCard session={fasting ?? null} onNavigate={() => onNavigate('meals')} />
            </div>

            {/* Habits today */}
            {habits && habits.total > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Flame size={18} color="var(--color-primary)" />
                            <span style={{ fontWeight: 700 }}>Today's Habits</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ProgressRing value={habits.completed} max={habits.total} size={44} stroke={4} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                {habits.completed}/{habits.total}
                            </span>
                        </div>
                    </div>
                    {habits.list.slice(0, 4).map(h => (
                        <div key={h.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 0', borderBottom: '1px solid var(--color-border-light)'
                        }}>
                            <div style={{
                                width: 22, height: 22, borderRadius: '50%',
                                border: `2px solid ${h.completion?.completed ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                background: h.completion?.completed ? 'var(--color-primary)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                {h.completion?.completed && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
                            </div>
                            <span style={{
                                fontSize: '0.875rem', fontWeight: 500,
                                color: h.completion?.completed ? 'var(--color-text-3)' : 'var(--color-text)',
                                textDecoration: h.completion?.completed ? 'line-through' : 'none',
                                flex: 1
                            }}>{h.name}</span>
                        </div>
                    ))}
                    {habits.total > 4 && (
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                            onClick={() => onNavigate('habits')}>
                            +{habits.total - 4} more
                        </button>
                    )}
                </div>
            )}

            {/* Calendar mini preview */}
            <div style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Calendar</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')} style={{ fontSize: '0.75rem' }}>
                        View all
                    </button>
                </div>
                <CalendarMini onNavigate={() => onNavigate('calendar')} />
            </div>

            {/* Health Analytics */}
            <div style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Health Analytics</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('measurements')} style={{ fontSize: '0.75rem' }}>
                        All data
                    </button>
                </div>

                {!hasCharts && !latest ? (
                    <div className="card" style={{ padding: '24px 20px', textAlign: 'center' }}>
                        <Ruler size={28} color="var(--color-border)" style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-3)', marginBottom: 12 }}>
                            Log body measurements to see your progress charts here.
                        </p>
                        <button className="btn btn-primary btn-sm" style={{ margin: '0 auto' }} onClick={() => onNavigate('measurements')}>
                            Add measurement
                        </button>
                    </div>
                ) : (
                    <>
                        {/* BMI gauge from latest */}
                        {latest?.bmi && <BmiGauge bmi={latest.bmi} />}

                        {/* BP card from latest */}
                        {latest?.systolicBp && latest?.diastolicBp && (
                            <BpCard systolic={latest.systolicBp} diastolic={latest.diastolicBp} />
                        )}

                        {/* Trend charts — only when 2+ entries */}
                        <MiniChart data={trends} dataKey="weight" color="var(--color-primary)" label="Weight" unit="kg" />
                        <MiniChart data={trends} dataKey="waist" color="#f59e0b" label="Waist" unit="cm" />
                        <MiniChart data={trends} dataKey="bodyFat" color="#ef4444" label="Body Fat" unit="%" />
                        <MiniChart data={trends} dataKey="hr" color="#8b5cf6" label="Resting Heart Rate" unit="bpm" referenceVal={60} />

                        {!hasCharts && latest && (
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', textAlign: 'center', marginTop: 4 }}>
                                Log a second measurement to see trend charts.
                            </p>
                        )}
                    </>
                )}
            </div>

            <div style={{ height: 8 }} />
        </div>
    );
}
