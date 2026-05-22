import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Dumbbell, UtensilsCrossed, Timer, Flame, Ruler, CheckCircle2 } from 'lucide-react';
import { format, startOfMonth, getDaysInMonth, getDay, subMonths, addMonths, parseISO } from 'date-fns';
import { api } from '../services/api';

const DOT_COLORS: Record<string, { color: string; Icon: React.ElementType }> = {
    hasWorkout:     { color: '#3b82f6', Icon: Dumbbell },
    hasMeal:        { color: '#f59e0b', Icon: UtensilsCrossed },
    hasFasting:     { color: '#8b5cf6', Icon: Timer },
    hasHabit:       { color: '#059669', Icon: Flame },
    hasMeasurement: { color: '#06b6d4', Icon: Ruler },
};

function DayDetailModal({ date, onClose }: { date: string; onClose: () => void }) {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        api.calendar.day(date).then(setData).catch(() => {});
    }, [date]);

    if (!data) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            </div>
        </div>
    );

    const fmt = format(parseISO(date), 'EEEE, MMMM d, yyyy');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3>{fmt}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Workouts */}
                    {data.workoutSessions?.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 700 }}>
                                <Dumbbell size={16} color="#3b82f6" /> Workouts
                            </div>
                            {data.workoutSessions.map((s: any) => (
                                <div key={s.id} style={{ padding: '10px 12px', background: '#eff6ff', borderRadius: 'var(--radius-lg)', marginBottom: 6 }}>
                                    <div style={{ fontWeight: 600 }}>{s.workoutPlan?.name || 'Workout'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: 4 }}>
                                        {s.exerciseLogs?.map((l: any) => l.exercise?.name).join(', ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Meals */}
                    {data.mealLogs?.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 700 }}>
                                <UtensilsCrossed size={16} color="#f59e0b" /> Meals
                            </div>
                            {data.mealLogs.map((m: any) => (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#fffbeb', borderRadius: 'var(--radius-lg)', marginBottom: 6 }}>
                                    <span className="badge badge-amber">{m.mealType}</span>
                                    <span style={{ fontSize: '0.875rem' }}>{m.foodItems}</span>
                                    {m.calories && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#92400e' }}>{m.calories} kcal</span>}
                                </div>
                            ))}
                            {data.mealSummary?.totalCalories > 0 && (
                                <div style={{ padding: '8px 12px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-lg)', fontSize: '0.8125rem', color: 'var(--color-text-2)' }}>
                                    Total: {Math.round(data.mealSummary.totalCalories)} kcal · {Math.round(data.mealSummary.totalProtein)}g protein
                                </div>
                            )}
                        </div>
                    )}

                    {/* Fasting */}
                    {data.fastingSessions?.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 700 }}>
                                <Timer size={16} color="#8b5cf6" /> Fasting
                            </div>
                            {data.fastingSessions.map((s: any) => {
                                const dur = s.endTime
                                    ? ((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000).toFixed(1)
                                    : null;
                                return (
                                    <div key={s.id} style={{ padding: '8px 12px', background: '#ede9fe', borderRadius: 'var(--radius-lg)' }}>
                                        <span style={{ fontSize: '0.875rem', color: '#5b21b6' }}>
                                            Target: {s.targetHours}h {dur ? `· Actual: ${dur}h` : ''} · {s.status}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Habits */}
                    {data.habitCompletions?.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 700 }}>
                                <Flame size={16} color="#059669" /> Habits
                            </div>
                            {data.habitCompletions.map((c: any) => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                                    <CheckCircle2 size={16} color={c.completed ? 'var(--color-primary)' : 'var(--color-border)'} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{c.habit?.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Measurements */}
                    {data.measurements?.length > 0 && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 700 }}>
                                <Ruler size={16} color="#06b6d4" /> Measurements
                            </div>
                            {data.measurements.map((m: any) => (
                                <div key={m.id} style={{ padding: '8px 12px', background: '#ecfeff', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.8125rem', color: '#0e7490' }}>
                                        {m.weight && <span>Weight: {m.weight}kg</span>}
                                        {m.bmi && <span>BMI: {m.bmi}</span>}
                                        {m.restingHeartRate && <span>HR: {m.restingHeartRate}bpm</span>}
                                        {m.systolicBp && <span>BP: {m.systolicBp}/{m.diastolicBp}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!data.workoutSessions?.length && !data.mealLogs?.length && !data.habitCompletions?.length && !data.measurements?.length && (
                        <div className="empty-state" style={{ padding: '20px 0' }}>
                            <p>No activity recorded on this day.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [calData, setCalData] = useState<Record<string, any>>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const today = format(new Date(), 'yyyy-MM-dd');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDow = getDay(startOfMonth(currentDate));

    useEffect(() => {
        api.calendar.month(year, month)
            .then(r => setCalData(r.days || {}))
            .catch(() => {});
    }, [year, month]);

    const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="page">
            {/* Month nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(d => subMonths(d, 1))}>
                    <ChevronLeft size={20} />
                </button>
                <h2>{format(currentDate, 'MMMM yyyy')}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(d => addMonths(d, 1))}>
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                {Object.entries(DOT_COLORS).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color }} />
                        {k.replace('has', '')}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="card" style={{ padding: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 6 }}>
                    {DOW_LABELS.map(d => (
                        <div key={d} style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', padding: '4px 0' }}>{d}</div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                    {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const d = i + 1;
                        const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                        const info = calData[dateStr];
                        const isToday = dateStr === today;
                        const dots = info ? Object.entries(DOT_COLORS).filter(([k]) => info[k]) : [];

                        return (
                            <div key={d} onClick={() => setSelectedDate(dateStr)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', minHeight: 44, borderRadius: 'var(--radius-lg)',
                                    background: isToday ? 'var(--color-primary)' : dots.length > 0 ? 'var(--color-surface-2)' : 'transparent',
                                    cursor: 'pointer', transition: 'background .12s', padding: '4px 2px'
                                }}>
                                <span style={{
                                    fontSize: '0.875rem', fontWeight: isToday ? 700 : 500,
                                    color: isToday ? '#fff' : 'var(--color-text)',
                                    lineHeight: 1.2
                                }}>{d}</span>
                                {dots.length > 0 && (
                                    <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
                                        {dots.slice(0, 4).map(([k, v]) => (
                                            <div key={k} style={{
                                                width: 4, height: 4, borderRadius: '50%',
                                                background: isToday ? 'rgba(255,255,255,.8)' : v.color
                                            }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedDate && (
                <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
            )}
        </div>
    );
}
