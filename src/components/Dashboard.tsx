import { RefreshCw, Dumbbell, UtensilsCrossed, Timer, Plus, Ruler, Flame, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardData, ViewMode } from '../types';
import FastingTimerCard from './FastingTimerCard';
import CalendarMini from './CalendarMini';

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

export default function Dashboard({ data, loading, onRefresh, onNavigate }: Props) {
    const today = format(new Date(), 'EEEE, MMMM d');

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
                border: 'none', boxShadow: '0 4px 16px rgba(5,150,105,.25)'
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

            {/* Fasting timer — always shown so user can start a fast from dashboard */}
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

            {/* Workout summary */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Dumbbell size={18} color="#3b82f6" />
                        <span style={{ fontWeight: 700 }}>Workouts</span>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('workouts')}>
                        <Plus size={14} /> Start
                    </button>
                </div>
                {workouts && workouts.count > 0 ? (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            <div className="stat-box">
                                <span className="stat-label">Today</span>
                                <span className="stat-value">{workouts.count}</span>
                                <span className="stat-unit">sessions</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Done</span>
                                <span className="stat-value" style={{ color: 'var(--color-primary)' }}>{workouts.completed}</span>
                                <span className="stat-unit">completed</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">This week</span>
                                <span className="stat-value">{data?.weeklyWorkoutCount || 0}</span>
                                <span className="stat-unit">workouts</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-3)' }}>
                        No workouts planned for today. <button className="btn-ghost" onClick={() => onNavigate('workouts')} style={{ fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Log one</button>
                    </p>
                )}
            </div>

            {/* Meal summary */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UtensilsCrossed size={18} color="#f59e0b" />
                        <span style={{ fontWeight: 700 }}>Nutrition Today</span>
                    </div>
                    <button className="btn btn-sm" style={{ background: '#fef3c7', color: '#92400e', border: 'none' }}
                        onClick={() => onNavigate('meals')}>
                        <Plus size={14} /> Log
                    </button>
                </div>
                {meals && meals.count > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                        {[
                            { label: 'Cal', value: Math.round(meals.calories), unit: 'kcal', color: '#f59e0b' },
                            { label: 'Protein', value: Math.round(meals.protein), unit: 'g', color: '#3b82f6' },
                            { label: 'Carbs', value: Math.round(meals.carbs), unit: 'g', color: '#8b5cf6' },
                            { label: 'Fat', value: Math.round(meals.fat), unit: 'g', color: '#ef4444' },
                        ].map(s => (
                            <div key={s.label} className="stat-box">
                                <span className="stat-label">{s.label}</span>
                                <span className="stat-value" style={{ fontSize: '1.125rem', color: s.color }}>{s.value}</span>
                                <span className="stat-unit">{s.unit}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-3)' }}>No meals logged today.</p>
                )}
                {meals && meals.water > 0 && (
                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 'var(--radius-lg)', background: '#eff6ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1rem' }}>💧</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e40af' }}>
                            {meals.water >= 1000 ? `${(meals.water/1000).toFixed(1)}L` : `${meals.water}ml`} water today
                        </span>
                    </div>
                )}
            </div>

            {/* Measurement reminder */}
            {measurement && (
                <div className="card" style={{
                    marginBottom: 16,
                    borderColor: measurement.status?.isOverdue ? 'var(--color-warning)' : 'var(--color-border-light)',
                    background: measurement.status?.isOverdue ? '#fffbeb' : 'var(--color-surface)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 'var(--radius-lg)', flexShrink: 0,
                            background: measurement.status?.isOverdue ? '#fef3c7' : 'var(--color-primary-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {measurement.status?.isOverdue
                                ? <AlertTriangle size={20} color="var(--color-warning)" />
                                : <Ruler size={20} color="var(--color-primary)" />
                            }
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, marginBottom: 2 }}>Body Measurements</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-2)' }}>
                                {measurement.latest
                                    ? (measurement.status?.isOverdue
                                        ? `Overdue by ${measurement.status.overdueDays} day${measurement.status.overdueDays !== 1 ? 's' : ''}`
                                        : `Next check-in in ${measurement.status?.dueIn} day${measurement.status?.dueIn !== 1 ? 's' : ''}`)
                                    : 'Add your first measurement'
                                }
                            </div>
                            {measurement.latest && (
                                <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {measurement.latest.weight && (
                                        <span className="badge badge-green">{measurement.latest.weight} kg</span>
                                    )}
                                    {measurement.latest.bmi && (
                                        <span className="badge badge-blue">BMI {measurement.latest.bmi}</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('measurements')}>
                            {measurement.latest ? 'Update' : 'Add'}
                        </button>
                    </div>
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

            <div style={{ height: 8 }} />
        </div>
    );
}
