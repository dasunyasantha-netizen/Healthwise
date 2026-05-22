import { useState, useEffect } from 'react';
import { Plus, X, UtensilsCrossed, Droplets, Trash2, Timer, Play, Square, Pencil } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { api } from '../services/api';
import { MealLog, FastingSession } from '../types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'other'] as const;
const FASTING_PRESETS = [12, 14, 16, 18, 20, 24];

function MealForm({ onClose, onSaved, date, editing }: { onClose: () => void; onSaved: () => void; date: string; editing?: MealLog }) {
    const [form, setForm] = useState({
        mealType: (editing?.mealType ?? 'lunch') as typeof MEAL_TYPES[number],
        foodItems: editing?.foodItems ?? '',
        time: editing?.time ?? format(new Date(), 'HH:mm'),
        calories: editing?.calories?.toString() ?? '',
        protein: editing?.protein?.toString() ?? '',
        carbs: editing?.carbs?.toString() ?? '',
        fat: editing?.fat?.toString() ?? '',
        waterMl: editing?.waterMl?.toString() ?? '',
        notes: editing?.notes ?? ''
    });
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!form.foodItems.trim()) return;
        setSaving(true);
        try {
            const payload = {
                date,
                time: form.time,
                mealType: form.mealType,
                foodItems: form.foodItems,
                calories: form.calories ? parseFloat(form.calories) : null,
                protein: form.protein ? parseFloat(form.protein) : null,
                carbs: form.carbs ? parseFloat(form.carbs) : null,
                fat: form.fat ? parseFloat(form.fat) : null,
                waterMl: form.waterMl ? parseFloat(form.waterMl) : null,
                notes: form.notes || null
            };
            if (editing) {
                await api.meals.update(editing.id, payload);
            } else {
                await api.meals.create(payload);
            }
            onSaved(); onClose();
        } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-sheet">
                <div className="modal-handle" />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3>{editing ? 'Edit Meal' : 'Log Meal'}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="tab-bar">
                        {MEAL_TYPES.map(t => (
                            <button key={t} className={`tab-item${form.mealType === t ? ' active' : ''}`}
                                onClick={() => setForm(f => ({ ...f, mealType: t }))}>
                                {t.charAt(0).toUpperCase() + t.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="form-group">
                        <label className="label">Food Items *</label>
                        <textarea className="input" placeholder="e.g. Rice with chicken and vegetables"
                            value={form.foodItems} onChange={e => setForm(f => ({ ...f, foodItems: e.target.value }))}
                            rows={2} style={{ resize: 'none' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group">
                            <label className="label">Time</label>
                            <input className="input" type="time" value={form.time}
                                onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="label">Calories (kcal)</label>
                            <input className="input" type="number" placeholder="0" value={form.calories}
                                onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <div className="form-group">
                            <label className="label">Protein (g)</label>
                            <input className="input" type="number" placeholder="0" value={form.protein}
                                onChange={e => setForm(f => ({ ...f, protein: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="label">Carbs (g)</label>
                            <input className="input" type="number" placeholder="0" value={form.carbs}
                                onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="label">Fat (g)</label>
                            <input className="input" type="number" placeholder="0" value={form.fat}
                                onChange={e => setForm(f => ({ ...f, fat: e.target.value }))} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Water (ml)</label>
                        <input className="input" type="number" placeholder="e.g. 500" value={form.waterMl}
                            onChange={e => setForm(f => ({ ...f, waterMl: e.target.value }))} />
                    </div>

                    <button className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 4 }}
                        onClick={save} disabled={saving || !form.foodItems.trim()}>
                        {saving ? 'Saving...' : editing ? 'Save Changes' : 'Log Meal'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FastingView() {
    const [active, setActive] = useState<FastingSession | null>(null);
    const [history, setHistory] = useState<FastingSession[]>([]);
    const [elapsed, setElapsed] = useState(0);
    const [targetHours, setTargetHours] = useState(16);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [a, h] = await Promise.all([api.fasting.active(), api.fasting.list()]);
            setActive(a);
            setHistory(h.filter((s: FastingSession) => s.status !== 'active').slice(0, 10));
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (!active) return;
        const tick = () => setElapsed(Date.now() - new Date(active.startTime).getTime());
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [active]);

    const fmt = (ms: number) => {
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };

    const pct = active ? Math.min(elapsed / (active.targetHours * 3600000), 1) : 0;
    const size = 160, stroke = 10, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct);

    if (loading) return <div style={{ padding: 24, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

    return (
        <div>
            {active ? (
                <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div className="badge badge-purple" style={{ marginBottom: 16, display: 'inline-flex' }}>Active Fast</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                                <circle fill="none" stroke="var(--color-border)" cx={size/2} cy={size/2} r={r} strokeWidth={stroke} />
                                <circle fill="none" stroke="#8b5cf6" cx={size/2} cy={size/2} r={r} strokeWidth={stroke}
                                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{fmt(elapsed)}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>Goal: {active.targetHours}h</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#8b5cf6', marginTop: 2 }}>
                                    {Math.round(pct * 100)}%
                                </div>
                            </div>
                        </div>
                    </div>
                    {pct >= 1 && (
                        <div style={{ marginBottom: 12, padding: '10px', background: '#f0fdf4', borderRadius: 'var(--radius-lg)', color: 'var(--color-primary)', fontWeight: 700 }}>
                            You've reached your goal!
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={async () => { await api.fasting.end(active.id); load(); }}>
                            <Square size={15} /> End Fast
                        </button>
                        <button className="btn btn-danger" onClick={async () => { await api.fasting.cancel(active.id); load(); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ marginBottom: 16 }}>
                    <h3 style={{ marginBottom: 14 }}>Start a Fast</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                        {FASTING_PRESETS.map(h => (
                            <button key={h} onClick={() => setTargetHours(h)}
                                className={`badge ${targetHours === h ? 'badge-purple' : 'badge-gray'}`}
                                style={{ cursor: 'pointer', border: 'none', padding: '6px 14px', fontSize: '0.875rem' }}>
                                {h}h
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }}
                        onClick={async () => { await api.fasting.start({ targetHours }); load(); }}>
                        <Play size={15} /> Start {targetHours}-hour Fast
                    </button>
                </div>
            )}

            {history.length > 0 && (
                <div>
                    <div className="section-title">History</div>
                    {history.map(s => {
                        const duration = s.endTime
                            ? (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 3600000
                            : null;
                        return (
                            <div key={s.id} className="card card-compact" style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{format(new Date(s.startTime), 'MMM d, yyyy')}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                            Target: {s.targetHours}h {duration ? `· Actual: ${duration.toFixed(1)}h` : ''}
                                        </div>
                                    </div>
                                    <span className={`badge ${s.status === 'completed' ? 'badge-green' : 'badge-gray'}`}>
                                        {s.status}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function MealsView() {
    const [tab, setTab] = useState<'log' | 'fasting'>('log');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [meals, setMeals] = useState<MealLog[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingMeal, setEditingMeal] = useState<MealLog | undefined>();

    const load = async () => {
        try {
            const m = await api.meals.byDate(date);
            setMeals(m);
        } catch {}
    };

    useEffect(() => { load(); }, [date]);

    const totals = {
        calories: meals.reduce((s, m) => s + (m.calories || 0), 0),
        protein: meals.reduce((s, m) => s + (m.protein || 0), 0),
        carbs: meals.reduce((s, m) => s + (m.carbs || 0), 0),
        fat: meals.reduce((s, m) => s + (m.fat || 0), 0),
        water: meals.reduce((s, m) => s + (m.waterMl || 0), 0),
    };

    return (
        <div className="page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Meals & Fasting</h2>
                {tab === 'log' && (
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                        <Plus size={15} /> Log Meal
                    </button>
                )}
            </div>

            <div className="tab-bar" style={{ marginBottom: 16 }}>
                <button className={`tab-item${tab === 'log' ? ' active' : ''}`} onClick={() => setTab('log')}>Food Log</button>
                <button className={`tab-item${tab === 'fasting' ? ' active' : ''}`} onClick={() => setTab('fasting')}>
                    <Timer size={14} /> Fasting
                </button>
            </div>

            {tab === 'log' && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDate(format(subDays(new Date(date), 1), 'yyyy-MM-dd'))}>←</button>
                        <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)}
                            style={{ flex: 1, textAlign: 'center' }} />
                        <button className="btn btn-ghost btn-sm" onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}>Today</button>
                    </div>

                    {meals.length > 0 && (
                        <div className="card" style={{ marginBottom: 14 }}>
                            <div style={{ fontWeight: 700, marginBottom: 12 }}>Daily Summary</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                                {[
                                    { label: 'Cal', value: Math.round(totals.calories), unit: 'kcal', color: '#f59e0b' },
                                    { label: 'Protein', value: Math.round(totals.protein), unit: 'g', color: '#3b82f6' },
                                    { label: 'Carbs', value: Math.round(totals.carbs), unit: 'g', color: '#8b5cf6' },
                                    { label: 'Fat', value: Math.round(totals.fat), unit: 'g', color: '#ef4444' },
                                ].map(s => (
                                    <div key={s.label} className="stat-box">
                                        <span className="stat-label">{s.label}</span>
                                        <span className="stat-value" style={{ fontSize: '1.125rem', color: s.color }}>{s.value}</span>
                                        <span className="stat-unit">{s.unit}</span>
                                    </div>
                                ))}
                            </div>
                            {totals.water > 0 && (
                                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#eff6ff', borderRadius: 'var(--radius-lg)' }}>
                                    <Droplets size={16} color="#3b82f6" />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e40af' }}>
                                        {totals.water >= 1000 ? `${(totals.water/1000).toFixed(1)}L` : `${totals.water}ml`}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {meals.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><UtensilsCrossed size={24} /></div>
                            <h3 style={{ marginBottom: 8 }}>No meals logged</h3>
                            <p style={{ fontSize: '0.875rem' }}>Start tracking your nutrition.</p>
                        </div>
                    ) : (
                        meals.map(m => (
                            <div key={m.id} className="card card-compact" style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <span className="badge badge-amber">{m.mealType}</span>
                                            {m.time && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{m.time}</span>}
                                        </div>
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{m.foodItems}</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {m.calories && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{m.calories} kcal</span>}
                                            {m.protein && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{m.protein}g protein</span>}
                                            {m.waterMl && <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}><Droplets size={10} style={{ display: 'inline' }} /> {m.waterMl}ml</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 2 }}>
                                        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                                            onClick={() => { setEditingMeal(m); setShowForm(true); }}>
                                            <Pencil size={14} color="var(--color-text-3)" />
                                        </button>
                                        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                                            onClick={async () => { await api.meals.delete(m.id); load(); }}>
                                            <Trash2 size={15} color="var(--color-text-3)" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tab === 'fasting' && <FastingView />}

            {showForm && <MealForm date={date} onClose={() => { setShowForm(false); setEditingMeal(undefined); }} onSaved={load} editing={editingMeal} />}
        </div>
    );
}
