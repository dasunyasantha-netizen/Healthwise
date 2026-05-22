import { useState, useEffect } from 'react';
import { Plus, X, Flame, CheckCircle2, Trophy, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../services/api';
import { Habit, HabitWithCompletion, HabitStats } from '../types';

const MILESTONE_BADGES: Record<number, { label: string; color: string }> = {
    3:   { label: '3-day streak',   color: '#f59e0b' },
    7:   { label: '7-day streak',   color: '#3b82f6' },
    14:  { label: '2-week streak',  color: '#8b5cf6' },
    30:  { label: '30-day streak',  color: '#0073ea' },
    60:  { label: '60-day streak',  color: '#0ea5e9' },
    100: { label: '100-day streak', color: '#f43f5e' },
};

const MOTIVATIONAL = [
    "One more day! You're building a habit that lasts.",
    "Consistency is the key. Keep showing up.",
    "Small daily actions create extraordinary results.",
    "Your future self will thank you for today.",
    "Progress over perfection. Just do it.",
];

function HabitStatsModal({ habit, onClose }: { habit: Habit; onClose: () => void }) {
    const [stats, setStats] = useState<HabitStats | null>(null);

    useEffect(() => {
        api.habits.stats(habit.id).then(setStats).catch(() => {});
    }, [habit.id]);

    if (!stats) return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            </div>
        </div>
    );

    const msg = stats.currentStreak === 0
        ? "Restart strong — every streak begins with one day."
        : MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3>{habit.name}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ padding: '14px', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-xl)', marginBottom: 16, textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
                        {stats.currentStreak}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-2)', marginTop: 4 }}>day streak</div>
                    <p style={{ marginTop: 10, fontSize: '0.875rem', color: 'var(--color-text-2)', fontStyle: 'italic' }}>{msg}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div className="stat-box">
                        <span className="stat-label">Best</span>
                        <span className="stat-value">{stats.longestStreak}</span>
                        <span className="stat-unit">days</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">7-day</span>
                        <span className="stat-value" style={{ color: 'var(--color-primary)' }}>{stats.completionRate7Days}%</span>
                        <span className="stat-unit">rate</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-label">30-day</span>
                        <span className="stat-value">{stats.completionRate30Days}%</span>
                        <span className="stat-unit">rate</span>
                    </div>
                </div>

                {stats.earnedBadges.length > 0 && (
                    <div>
                        <div className="section-title">Badges Earned</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {stats.earnedBadges.map(m => {
                                const badge = MILESTONE_BADGES[m];
                                return badge ? (
                                    <div key={m} style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '6px 12px', borderRadius: 99, fontWeight: 700,
                                        fontSize: '0.8125rem', background: `${badge.color}18`, color: badge.color
                                    }}>
                                        <Trophy size={14} /> {badge.label}
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                {stats.recentCompletions.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <div className="section-title">Recent Activity (last 30 days)</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {Array.from({ length: 30 }, (_, i) => {
                                const d = format(new Date(Date.now() - i * 86400000), 'yyyy-MM-dd');
                                const done = stats.recentCompletions.includes(d);
                                return (
                                    <div key={d} style={{
                                        width: 12, height: 12, borderRadius: 3,
                                        background: done ? 'var(--color-primary)' : 'var(--color-border)',
                                        title: d
                                    }} title={d} />
                                );
                            }).reverse()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function NewHabitForm({ onClose, onSaved, editing }: { onClose: () => void; onSaved: () => void; editing?: Habit }) {
    const [form, setForm] = useState({
        name: editing?.name ?? '',
        description: editing?.description ?? '',
        frequency: (editing?.frequency ?? 'daily') as 'daily' | 'selected_days' | 'weekly',
        selectedDays: editing?.selectedDays ?? [] as number[],
        targetValue: editing?.targetValue?.toString() ?? '',
        unit: editing?.unit ?? '',
        startDate: editing?.startDate ?? format(new Date(), 'yyyy-MM-dd'),
        reminderTime: editing?.reminderTime ?? '',
        motivationMsg: editing?.motivationMsg ?? ''
    });
    const [saving, setSaving] = useState(false);
    const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const save = async () => {
        if (!form.name.trim()) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                targetValue: form.targetValue ? parseFloat(form.targetValue) : null,
                unit: form.unit || null,
                reminderTime: form.reminderTime || null,
                motivationMsg: form.motivationMsg || null,
                active: true
            };
            if (editing) {
                await api.habits.update(editing.id, payload);
            } else {
                await api.habits.create(payload);
            }
            onSaved(); onClose();
        } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-sheet">
                <div className="modal-handle" />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3>{editing ? 'Edit Habit' : 'New Habit'}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="form-group">
                        <label className="label">Habit Name *</label>
                        <input className="input" placeholder="e.g. Drink 2L water" value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>

                    <div className="form-group">
                        <label className="label">Description (optional)</label>
                        <input className="input" placeholder="Why this matters to you" value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>

                    <div className="form-group">
                        <label className="label">Frequency</label>
                        <select className="input" value={form.frequency}
                            onChange={e => setForm(f => ({ ...f, frequency: e.target.value as any }))}>
                            <option value="daily">Every day</option>
                            <option value="selected_days">Specific days</option>
                            <option value="weekly">Once a week</option>
                        </select>
                    </div>

                    {form.frequency === 'selected_days' && (
                        <div>
                            <label className="label">Days</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {DOW.map((d, i) => {
                                    const on = form.selectedDays.includes(i);
                                    return (
                                        <button key={d} onClick={() => setForm(f => ({
                                            ...f,
                                            selectedDays: on ? f.selectedDays.filter(x => x !== i) : [...f.selectedDays, i]
                                        }))} style={{
                                            flex: 1, padding: '6px 2px', borderRadius: 'var(--radius-md)',
                                            background: on ? 'var(--color-primary)' : 'var(--color-surface-2)',
                                            color: on ? '#fff' : 'var(--color-text-3)',
                                            border: `1.5px solid ${on ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            fontFamily: 'var(--font)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer'
                                        }}>{d}</button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group">
                            <label className="label">Target (optional)</label>
                            <input className="input" type="number" placeholder="e.g. 8000" value={form.targetValue}
                                onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="label">Unit</label>
                            <input className="input" placeholder="steps, ml, hours..." value={form.unit}
                                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Motivation Message (optional)</label>
                        <input className="input" placeholder="What keeps you going?" value={form.motivationMsg}
                            onChange={e => setForm(f => ({ ...f, motivationMsg: e.target.value }))} />
                    </div>

                    <button className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 4 }}
                        onClick={save} disabled={saving || !form.name.trim()}>
                        {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Habit'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function HabitsView() {
    const [habits, setHabits] = useState<HabitWithCompletion[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
    const today = format(new Date(), 'yyyy-MM-dd');

    const load = async () => {
        try {
            const data = await api.habits.byDate(today);
            setHabits(data);
        } catch {}
    };

    useEffect(() => { load(); }, []);

    const toggle = async (h: HabitWithCompletion) => {
        const isDone = h.completion?.completed;
        try {
            if (isDone) {
                await api.habits.uncomplete(h.id, { date: today });
            } else {
                await api.habits.complete(h.id, { date: today });
            }
            load();
        } catch {}
    };

    const completedCount = habits.filter(h => h.completion?.completed).length;
    const totalCount = habits.length;
    const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const msg = completedCount === totalCount && totalCount > 0
        ? "All habits done! You're unstoppable today."
        : completedCount === 0 && totalCount > 0
        ? "Ready to start? Tick off your first habit."
        : `${totalCount - completedCount} habit${totalCount - completedCount !== 1 ? 's' : ''} remaining.`;

    return (
        <div className="page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Habits & Streaks</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                    <Plus size={15} /> New Habit
                </button>
            </div>

            {totalCount > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ position: 'relative' }}>
                            <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
                                <circle fill="none" stroke="var(--color-border)" cx={36} cy={36} r={30} strokeWidth={6} />
                                <circle fill="none" stroke="var(--color-primary)" cx={36} cy={36} r={30} strokeWidth={6}
                                    strokeDasharray={2 * Math.PI * 30}
                                    strokeDashoffset={2 * Math.PI * 30 * (1 - pct / 100)}
                                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset .5s ease' }} />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary)' }}>{Math.round(pct)}%</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, marginBottom: 2 }}>{completedCount} / {totalCount} done</div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-2)' }}>{msg}</p>
                        </div>
                    </div>
                </div>
            )}

            {habits.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon"><Flame size={24} /></div>
                    <h3 style={{ marginBottom: 8 }}>No habits yet</h3>
                    <p style={{ fontSize: '0.875rem' }}>Create a habit to start building your streak.</p>
                </div>
            ) : (
                habits.map(h => {
                    const done = h.completion?.completed;
                    return (
                        <div key={h.id} className={`habit-row${done ? ' done' : ''}`}>
                            <button className={`habit-check${done ? ' done' : ''}`} onClick={() => toggle(h)}>
                                {done && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
                            </button>
                            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelectedHabit(h)}>
                                <div style={{
                                    fontWeight: 600,
                                    textDecoration: done ? 'line-through' : 'none',
                                    color: done ? 'var(--color-text-3)' : 'var(--color-text)'
                                }}>{h.name}</div>
                                {h.description && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{h.description}</div>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {done && <Flame size={16} color="var(--color-primary)" />}
                                <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                                    onClick={() => setSelectedHabit(h)}>
                                    <Trophy size={14} color="var(--color-text-3)" />
                                </button>
                                <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                                    onClick={() => { setEditingHabit(h); setShowForm(true); }}>
                                    <Pencil size={14} color="var(--color-text-3)" />
                                </button>
                                <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                                    onClick={async () => {
                                        if (confirm('Delete this habit?')) {
                                            await api.habits.delete(h.id);
                                            load();
                                        }
                                    }}>
                                    <Trash2 size={14} color="var(--color-text-3)" />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}

            {showForm && <NewHabitForm onClose={() => { setShowForm(false); setEditingHabit(undefined); }} onSaved={load} editing={editingHabit} />}
            {selectedHabit && <HabitStatsModal habit={selectedHabit} onClose={() => setSelectedHabit(null)} />}
        </div>
    );
}
