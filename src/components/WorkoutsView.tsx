import { useState, useEffect, useRef } from 'react';
import { Plus, Dumbbell, Search, ChevronRight, X, Play, CheckCircle2, ExternalLink, Trash2, Timer, RotateCcw, Pencil, ChevronDown, BarChart2, TrendingUp } from 'lucide-react';
import { format, startOfWeek, parseISO } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { Exercise, WorkoutPlan, WorkoutSession } from '../types';

type Tab = 'today' | 'plans' | 'library' | 'analytics';

const MUSCLE_LABELS: Record<string, string> = {
    'Anterior Deltoid':   'Front shoulder',
    'Biceps Brachii':     'Upper arm (front)',
    'Brachialis':         'Under bicep',
    'Calves':             'Lower leg (back)',
    'Chest':              'Pectorals',
    'Core':               'Abs & stability',
    'Erector Spinae':     'Lower back',
    'Full Body':          'Multiple muscles',
    'Glutes':             'Buttocks',
    'Hamstrings':         'Back of thigh',
    'Infraspinatus':      'Rear shoulder (rotator)',
    'Latissimus Dorsi':   'Side back (lats)',
    'Lateral Deltoid':    'Side shoulder',
    'Posterior Deltoid':  'Rear shoulder',
    'Quads':              'Front of thigh',
    'Rhomboids':          'Upper mid-back',
    'Shoulders':          'Deltoids',
    'Back':               'Upper & mid back',
    'Biceps':             'Upper arm (front)',
    'Triceps':            'Upper arm (back)',
    'Trapezius':          'Upper back & neck',
    'Tibialis Anterior':  'Front of shin',
    'Soleus':             'Deep calf',
    'Rectus Femoris':     'Front thigh (quad)',
    'Neck':               'Cervical muscles',
};

// Maps any specific primaryMuscle value → one of 9 major groups for the filter dropdown
const MUSCLE_GROUP: Record<string, string> = {
    // Chest
    'Chest': 'Chest', 'Pectoralis Major': 'Chest', 'Pectoralis Major (Upper)': 'Chest',
    'Pectoralis Minor': 'Chest', 'Serratus Anterior': 'Chest',
    // Back
    'Back': 'Back', 'Latissimus Dorsi': 'Back', 'Rhomboids': 'Back',
    'Trapezius': 'Back', 'Erector Spinae': 'Back', 'Teres Major': 'Back',
    'Teres Minor': 'Back', 'Infraspinatus': 'Back', 'Rear Deltoid': 'Back',
    // Shoulders
    'Shoulders': 'Shoulders', 'Anterior Deltoid': 'Shoulders', 'Lateral Deltoid': 'Shoulders',
    'Posterior Deltoid': 'Shoulders', 'Rotator Cuff': 'Shoulders',
    // Arms
    'Biceps': 'Arms', 'Biceps Brachii': 'Arms', 'Brachialis': 'Arms', 'Brachioradialis': 'Arms',
    'Triceps': 'Arms', 'Triceps Brachii': 'Arms', 'Triceps Brachii (Long Head)': 'Arms',
    'Forearms': 'Arms', 'Wrist Flexors': 'Arms', 'Wrist Extensors': 'Arms',
    // Core
    'Core': 'Core', 'Rectus Abdominis': 'Core', 'Rectus Abdominis (Lower)': 'Core',
    'Obliques': 'Core', 'Transverse Abdominis': 'Core', 'Hip Flexors': 'Core',
    // Legs
    'Quads': 'Legs', 'Quadriceps': 'Legs', 'Rectus Femoris': 'Legs',
    'Hamstrings': 'Legs', 'Glutes': 'Legs', 'Gluteus Maximus': 'Legs',
    'Gluteus Medius': 'Legs', 'Hip Abductors': 'Legs', 'Hip Adductors': 'Legs',
    'Calves': 'Legs', 'Gastrocnemius': 'Legs', 'Soleus': 'Legs',
    'Tibialis Anterior': 'Legs', 'Neck': 'Legs',
    // Full Body
    'Full Body': 'Full Body',
};

const MAJOR_GROUPS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Legs', 'Full Body'];

function getMajorGroup(muscle: string): string {
    return MUSCLE_GROUP[muscle] ?? 'Other';
}

function CustomSelect({ label, value, options, onChange }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedLabel = options.find(o => o.value === value)?.label ?? value;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="form-group" style={{ margin: 0 }} ref={ref}>
            <label className="label">{label}</label>
            <div style={{ position: 'relative' }}>
                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    style={{
                        width: '100%', padding: '11px 14px',
                        border: `1.5px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font)',
                        fontSize: '0.9375rem', color: 'var(--color-text)',
                        background: 'var(--color-surface)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        textAlign: 'left', transition: 'border-color .15s',
                    }}
                >
                    <span>{selectedLabel}</span>
                    <ChevronDown size={16} color="var(--color-text-3)"
                        style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
                </button>
                {open && (
                    <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)', zIndex: 999,
                        boxShadow: '0 8px 24px rgba(0,0,0,.12)', overflow: 'hidden',
                    }}>
                        {options.map(o => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => { onChange(o.value); setOpen(false); }}
                                style={{
                                    width: '100%', padding: '10px 14px', border: 'none',
                                    background: o.value === value ? 'var(--color-primary-bg)' : 'transparent',
                                    color: o.value === value ? 'var(--color-primary)' : 'var(--color-text)',
                                    fontFamily: 'var(--font)', fontSize: '0.9375rem',
                                    fontWeight: o.value === value ? 700 : 400,
                                    cursor: 'pointer', textAlign: 'left',
                                    borderBottom: '1px solid var(--color-border-light)',
                                    display: 'block',
                                }}
                            >
                                {o.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── EXERCISE TIMER ─────────────────────────────────────────────────────────

function ExerciseTimer({ onSave }: { onSave: (seconds: number) => void }) {
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [manualInput, setManualInput] = useState('');

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setElapsed(e => e + 1), 1000);
        return () => clearInterval(id);
    }, [running]);

    const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

    return (
        <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-xl)', padding: 16, marginTop: 12 }}>
            <div className="timer-display" style={{ fontSize: '2.5rem', marginBottom: 12 }}>{fmt(elapsed)}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                <button className="btn btn-primary btn-sm" onClick={() => setRunning(r => !r)}>
                    {running ? 'Pause' : elapsed > 0 ? 'Resume' : <><Play size={13} /> Start</>}
                </button>
                {elapsed > 0 && (
                    <>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setRunning(false); onSave(elapsed); }}>
                            <CheckCircle2 size={13} /> Save
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setRunning(false); setElapsed(0); }}>
                            <RotateCcw size={13} />
                        </button>
                    </>
                )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input className="input" placeholder="Manual (seconds)" value={manualInput}
                    onChange={e => setManualInput(e.target.value)} type="number"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.875rem' }} />
                <button className="btn btn-ghost btn-sm" onClick={() => {
                    const v = parseInt(manualInput);
                    if (!isNaN(v) && v > 0) { onSave(v); setManualInput(''); }
                }}>Set</button>
            </div>
        </div>
    );
}

// ─── SET LOGGER ──────────────────────────────────────────────────────────────

function SetLogger({ logId, sets, trackingType, exerciseName, prevSets }: {
    logId: string; sets: any[]; trackingType: string;
    exerciseName: string; prevSets: any[];
}) {
    const [localSets, setLocalSets] = useState(sets);
    const [saving, setSaving] = useState(false);
    const [showTimer, setShowTimer] = useState(false);

    const isTime = trackingType === 'time';

    const addSet = async () => {
        setSaving(true);
        try {
            const setNum = localSets.length + 1;
            const prev = prevSets[localSets.length];
            const newSet = await api.workouts.exerciseLogs.addSet(logId, {
                setNumber: setNum,
                weight: prev?.weight,
                reps: prev?.reps,
                timeSeconds: prev?.timeSeconds,
                completed: false
            });
            setLocalSets(s => [...s, newSet]);
        } finally { setSaving(false); }
    };

    const updateSet = async (setId: string, field: string, value: any) => {
        setLocalSets(s => s.map(x => x.id === setId ? { ...x, [field]: value } : x));
        try { await api.workouts.setLogs.update(setId, { [field]: value }); } catch {}
    };

    const removeSet = async (setId: string) => {
        setLocalSets(s => s.filter(x => x.id !== setId));
        try { await api.workouts.setLogs.delete(setId); } catch {}
    };

    const saveTimer = async (seconds: number) => {
        const last = localSets[localSets.length - 1];
        if (last) { updateSet(last.id, 'timeSeconds', seconds); }
        setShowTimer(false);
    };

    return (
        <div>
            {prevSets.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', marginBottom: 8, padding: '4px 8px', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                    Last: {prevSets.slice(0,3).map(s => isTime ? `${s.timeSeconds}s` : `${s.weight}kg × ${s.reps}`).join(', ')}
                </div>
            )}

            {localSets.map((set, i) => (
                <div key={set.id} className="set-row">
                    <div className="set-num">{set.setNumber}</div>
                    {isTime ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input className="set-input" style={{ flex: 1 }}
                                type="number" placeholder="Sec"
                                value={set.timeSeconds || ''}
                                onChange={e => updateSet(set.id, 'timeSeconds', parseInt(e.target.value) || null)} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>sec</span>
                        </div>
                    ) : (
                        <>
                            {trackingType !== 'reps_only' && (
                                <>
                                    <input className="set-input" type="number" placeholder="kg"
                                        value={set.weight || ''}
                                        onChange={e => updateSet(set.id, 'weight', parseFloat(e.target.value) || null)} />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>×</span>
                                </>
                            )}
                            <input className="set-input" type="number" placeholder="reps"
                                value={set.reps || ''}
                                onChange={e => updateSet(set.id, 'reps', parseInt(e.target.value) || null)} />
                        </>
                    )}
                    <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                        onClick={() => updateSet(set.id, 'completed', !set.completed)}>
                        <CheckCircle2 size={18} color={set.completed ? 'var(--color-primary)' : 'var(--color-border)'} />
                    </button>
                    <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                        onClick={() => removeSet(set.id)}>
                        <Trash2 size={14} color="var(--color-text-3)" />
                    </button>
                </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={addSet} disabled={saving}>
                    <Plus size={13} /> Add Set
                </button>
                {isTime && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowTimer(v => !v)}>
                        <Timer size={13} /> Timer
                    </button>
                )}
            </div>

            {showTimer && <ExerciseTimer onSave={saveTimer} />}
        </div>
    );
}

// ─── EXERCISE DETAIL MODAL ───────────────────────────────────────────────────

function ExerciseDetailModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                <div className="modal-handle" />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                        <h2>{exercise.name}</h2>
                        <span className="badge badge-green" style={{ marginTop: 4 }}>{exercise.category}</span>
                    </div>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="stat-box">
                            <span className="stat-label">Primary</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{exercise.primaryMuscle}</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Equipment</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{exercise.equipment}</span>
                        </div>
                    </div>

                    {exercise.secondaryMuscles.length > 0 && (
                        <div>
                            <div className="label">Secondary Muscles</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {exercise.secondaryMuscles.map(m => (
                                    <span key={m} className="badge badge-gray">{m}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {exercise.instructions && (
                        <div>
                            <div className="label">Instructions</div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-2)', lineHeight: 1.6 }}>{exercise.instructions}</p>
                        </div>
                    )}

                    {exercise.safetyNotes && (
                        <div style={{ padding: 12, background: '#fef3c7', borderRadius: 'var(--radius-lg)', border: '1px solid #fde68a' }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Safety</div>
                            <p style={{ fontSize: '0.8125rem', color: '#92400e' }}>{exercise.safetyNotes}</p>
                        </div>
                    )}

                    {exercise.demoVideoUrl && (
                        <a href={exercise.demoVideoUrl} target="_blank" rel="noopener noreferrer"
                            className="btn btn-secondary w-full" style={{ justifyContent: 'center' }}>
                            <ExternalLink size={15} /> Watch Demo Video
                        </a>
                    )}

                    {exercise.sourceUrl && exercise.sourceUrl !== exercise.demoVideoUrl && (
                        <a href={exercise.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="btn btn-ghost w-full" style={{ justifyContent: 'center', fontSize: '0.8125rem' }}>
                            <ExternalLink size={14} /> View Source
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── WORKOUT PLAN BUILDER ─────────────────────────────────────────────────────

function WorkoutPlanBuilder({ onClose, onSaved, editing }: { onClose: () => void; onSaved: () => void; editing?: WorkoutPlan }) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selected, setSelected] = useState<{ exercise: Exercise; targetSets: number; targetReps: number; targetWeight: number; targetTimeSeconds: number; restSeconds: number }[]>([]);
    const [name, setName] = useState(editing?.name ?? '');
    const [date, setDate] = useState(editing?.date ?? format(new Date(), 'yyyy-MM-dd'));
    const [isTemplate, setIsTemplate] = useState(editing?.isTemplate ?? false);
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<'info' | 'exercises'>('info');
    const [showNewEx, setShowNewEx] = useState(false);
    const [newEx, setNewEx] = useState({
        name: '',
        category: 'Strength',
        trackingType: 'reps_weight' as Exercise['trackingType'],
        equipment: 'Bodyweight',
        primaryMuscle: 'Chest',
    });
    const [creatingEx, setCreatingEx] = useState(false);
    const [muscleFilter, setMuscleFilter] = useState('');

    useEffect(() => {
        api.exercises.list().then(exList => {
            setExercises(exList);
            if (editing?.exercises?.length) {
                setSelected(editing.exercises.map((pe: any) => ({
                    exercise: pe.exercise,
                    targetSets: pe.targetSets ?? 3,
                    targetReps: pe.targetReps ?? 10,
                    targetWeight: pe.targetWeight ?? 0,
                    targetTimeSeconds: pe.targetTimeSeconds ?? 0,
                    restSeconds: pe.restSeconds ?? 90,
                })));
            }
        }).catch(() => {});
    }, []);

    const filtered = exercises.filter(e =>
        (e.name.toLowerCase().includes(search.toLowerCase()) ||
         e.category.toLowerCase().includes(search.toLowerCase()) ||
         (e.primaryMuscle ?? '').toLowerCase().includes(search.toLowerCase())) &&
        (!muscleFilter || getMajorGroup(e.primaryMuscle ?? '') === muscleFilter)
    );
    const grouped = filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
        const key = getMajorGroup(ex.primaryMuscle ?? '');
        if (!acc[key]) acc[key] = [];
        acc[key].push(ex);
        return acc;
    }, {});

    const addExercise = (ex: Exercise) => {
        if (selected.find(s => s.exercise.id === ex.id)) return;
        setSelected(s => [...s, {
            exercise: ex,
            targetSets: ex.trackingType === 'time' ? 1 : 3,
            targetReps: ex.trackingType === 'time' ? 0 : 10,
            targetWeight: 0,
            targetTimeSeconds: ex.trackingType === 'time' ? 60 : 0,
            restSeconds: 90
        }]);
    };

    const remove = (id: string) => setSelected(s => s.filter(x => x.exercise.id !== id));

    const createAndAdd = async () => {
        if (!newEx.name.trim()) return;
        setCreatingEx(true);
        try {
            const created: Exercise = await api.exercises.create({
                name: newEx.name.trim(),
                category: newEx.category,
                trackingType: newEx.trackingType,
                equipment: newEx.equipment,
                primaryMuscle: newEx.primaryMuscle,
                secondaryMuscles: [],
                bodyPartFocus: newEx.primaryMuscle,
                isSystem: false,
            });
            setExercises(prev => [...prev, created]);
            addExercise(created);
            setShowNewEx(false);
            setNewEx({ name: '', category: 'Strength', trackingType: 'reps_weight', equipment: 'Bodyweight', primaryMuscle: 'Chest' });
            setSearch('');
        } catch {} finally { setCreatingEx(false); }
    };

    const save = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const payload = {
                name,
                date: isTemplate ? null : date,
                isTemplate,
                exercises: selected.map(s => ({
                    exerciseId: s.exercise.id,
                    targetSets: s.targetSets,
                    targetReps: s.targetReps,
                    targetWeight: s.targetWeight || null,
                    targetTimeSeconds: s.targetTimeSeconds || null,
                    restSeconds: s.restSeconds
                }))
            };
            if (editing) {
                await api.workouts.plans.update(editing.id, payload);
            } else {
                await api.workouts.plans.create(payload);
            }
            onSaved();
            onClose();
        } finally { setSaving(false); }
    };

    return (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', overflowY: 'auto' }}>
            <div className="modal-sheet" style={{ maxHeight: 'none', borderRadius: 0, minHeight: '100%', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h2>{editing ? 'Edit Plan' : 'New Workout Plan'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
                </div>

                {step === 'info' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-group">
                            <label className="label">Plan Name</label>
                            <input className="input" placeholder="e.g. Push Day, Leg Day" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="checkbox" id="tmpl" checked={isTemplate} onChange={e => setIsTemplate(e.target.checked)} style={{ width: 16, height: 16 }} />
                            <label htmlFor="tmpl" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Save as template (reusable)</label>
                        </div>
                        {!isTemplate && (
                            <div className="form-group">
                                <label className="label">Workout Date</label>
                                <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                        )}
                        <button className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 8 }}
                            onClick={() => setStep('exercises')} disabled={!name.trim()}>
                            Choose Exercises →
                        </button>
                    </div>
                ) : (
                    <div>
                        {selected.length > 0 && (
                            <div style={{ marginBottom: 14 }}>
                                <div className="section-title">Selected ({selected.length})</div>
                                {selected.map(s => (
                                    <div key={s.exercise.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        padding: '8px 10px', borderRadius: 'var(--radius-lg)',
                                        background: 'var(--color-primary-bg)', marginBottom: 6
                                    }}>
                                        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600 }}>{s.exercise.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {s.exercise.trackingType === 'time' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>sec</span>
                                                    <input className="set-input" type="number"
                                                        value={s.targetTimeSeconds || ''} style={{ width: 52, textAlign: 'center' }}
                                                        onChange={e => setSelected(prev => prev.map(x => x.exercise.id === s.exercise.id ? { ...x, targetTimeSeconds: parseInt(e.target.value) || 0 } : x))} />
                                                </div>
                                            ) : (
                                                <>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>sets</span>
                                                        <input className="set-input" type="number"
                                                            value={s.targetSets || ''} style={{ width: 44, textAlign: 'center' }}
                                                            onChange={e => setSelected(prev => prev.map(x => x.exercise.id === s.exercise.id ? { ...x, targetSets: parseInt(e.target.value) || 0 } : x))} />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase' }}>reps</span>
                                                        <input className="set-input" type="number"
                                                            value={s.targetReps || ''} style={{ width: 44, textAlign: 'center' }}
                                                            onChange={e => setSelected(prev => prev.map(x => x.exercise.id === s.exercise.id ? { ...x, targetReps: parseInt(e.target.value) || 0 } : x))} />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <button className="btn btn-ghost btn-icon" onClick={() => remove(s.exercise.id)}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                                <input className="input" placeholder="Search exercises..." value={search}
                                    onChange={e => { setSearch(e.target.value); setShowNewEx(false); }} style={{ paddingLeft: 36 }} />
                            </div>
                            <button className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                                onClick={() => { setShowNewEx(v => !v); setNewEx(n => ({ ...n, name: search })); }}>
                                <Plus size={14} /> New
                            </button>
                        </div>

                        {showNewEx && (
                            <div style={{
                                background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-xl)',
                                padding: '14px', marginBottom: 10,
                                border: '1.5px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: 12
                            }}>
                                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-primary)' }}>Create new exercise</div>
                                <input className="input" placeholder="Exercise name" value={newEx.name}
                                    onChange={e => setNewEx(n => ({ ...n, name: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && createAndAdd()} autoFocus />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <CustomSelect label="Category" value={newEx.category}
                                        options={['Strength','Cardio','Flexibility','Balance','Sports','Other'].map(c => ({ value: c, label: c }))}
                                        onChange={v => setNewEx(n => ({ ...n, category: v }))} />
                                    <CustomSelect label="Muscle Target" value={newEx.primaryMuscle}
                                        options={['Chest','Back','Shoulders','Biceps','Triceps','Core','Quads','Hamstrings','Glutes','Calves','Full Body'].map(m => ({ value: m, label: m }))}
                                        onChange={v => setNewEx(n => ({ ...n, primaryMuscle: v }))} />
                                    <CustomSelect label="Tracking" value={newEx.trackingType}
                                        options={[
                                            { value: 'reps_weight', label: 'Reps + Weight' },
                                            { value: 'reps_only',   label: 'Reps only' },
                                            { value: 'time',        label: 'Time' },
                                            { value: 'distance',    label: 'Distance' },
                                        ]}
                                        onChange={v => setNewEx(n => ({ ...n, trackingType: v as Exercise['trackingType'] }))} />
                                    <CustomSelect label="Equipment" value={newEx.equipment}
                                        options={['Bodyweight','Barbell','Dumbbell','Machine','Cable','Resistance Band','Kettlebell','Other'].map(eq => ({ value: eq, label: eq }))}
                                        onChange={v => setNewEx(n => ({ ...n, equipment: v }))} />
                                </div>

                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setShowNewEx(false)}>Cancel</button>
                                    <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                                        onClick={createAndAdd} disabled={creatingEx || !newEx.name.trim()}>
                                        {creatingEx ? 'Adding...' : 'Add to plan'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Muscle group filter dropdown */}
                        <div style={{ marginBottom: 10 }}>
                            <CustomSelect
                                label=""
                                value={muscleFilter}
                                options={[
                                    { value: '', label: 'All muscle groups' },
                                    ...MAJOR_GROUPS.map(g => ({ value: g, label: g }))
                                ]}
                                onChange={v => setMuscleFilter(v)}
                            />
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setStep('info')}>← Back</button>
                            <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                                onClick={save} disabled={saving || selected.length === 0}>
                                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Plan'}
                            </button>
                        </div>

                        {/* Grouped exercise list */}
                        {filtered.length === 0 && !showNewEx ? (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-3)', fontSize: '0.875rem' }}>
                                No exercises found.{' '}
                                <button style={{ color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                                    onClick={() => { setShowNewEx(true); setNewEx(n => ({ ...n, name: search })); }}>
                                    Create "{search}"
                                </button>
                            </div>
                        ) : (
                            MAJOR_GROUPS.filter(g => grouped[g]?.length).map(group => (
                                <div key={group} style={{ marginBottom: 10 }}>
                                    <div style={{
                                        fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-primary)',
                                        textTransform: 'uppercase', letterSpacing: '.07em',
                                        padding: '3px 2px 3px', marginBottom: 3,
                                        borderBottom: '1.5px solid var(--color-primary-bg)',
                                    }}>{group}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        {(grouped[group] ?? []).map(ex => {
                                            const isAdded = selected.some(s => s.exercise.id === ex.id);
                                            return (
                                                <div key={ex.id} onClick={() => addExercise(ex)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10,
                                                        padding: '7px 10px', borderRadius: 'var(--radius-lg)',
                                                        background: isAdded ? 'var(--color-primary-bg)' : 'var(--color-surface-2)',
                                                        cursor: 'pointer', transition: 'background .12s',
                                                        border: isAdded ? '1px solid var(--color-primary)' : '1px solid transparent',
                                                    }}>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: isAdded ? 'var(--color-primary)' : 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.name}</div>
                                                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-3)' }}>{ex.equipment}</div>
                                                    </div>
                                                    {isAdded
                                                        ? <CheckCircle2 size={16} color="var(--color-primary)" strokeWidth={2.5} />
                                                        : <Plus size={15} color="var(--color-text-3)" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}

// ─── WORKOUT SESSION RUNNER ───────────────────────────────────────────────────

function SessionRunner({ session, onClose, onComplete }: {
    session: WorkoutSession; onClose: () => void; onComplete: () => void;
}) {
    const [current, setCurrent] = useState(session);
    const [prevSetsMap, setPrevSetsMap] = useState<Record<string, any[]>>({});

    useEffect(() => {
        // Load previous sets for each exercise
        const load = async () => {
            const map: Record<string, any[]> = {};
            for (const log of current.exerciseLogs) {
                try {
                    const history = await api.workouts.history(log.exerciseId);
                    if (history.length > 0) map[log.exerciseId] = history[0].sets || [];
                } catch {}
            }
            setPrevSetsMap(map);
        };
        load();
    }, []);

    const addExercise = async (exerciseId: string) => {
        try {
            const log = await api.workouts.sessions.addLog(current.id, { exerciseId, orderIndex: current.exerciseLogs.length });
            setCurrent(s => ({ ...s, exerciseLogs: [...s.exerciseLogs, log] }));
        } catch {}
    };

    const completeSession = async () => {
        try {
            await api.workouts.sessions.complete(current.id);
            onComplete();
            onClose();
        } catch {}
    };

    return (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', overflowY: 'auto' }}>
            <div style={{ background: 'var(--color-surface)', width: '100%', minHeight: '100%', padding: '20px 16px 40px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                    <div style={{ flex: 1 }}>
                        <h2>{current.workoutPlan?.name || 'Workout'}</h2>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)' }}>{current.exerciseLogs.length} exercises</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={completeSession}>
                        <CheckCircle2 size={14} /> Finish
                    </button>
                </div>

                {current.exerciseLogs.map((log, i) => (
                    <div key={log.id} className="card card-compact" style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div className="exercise-icon" style={{ width: 36, height: 36, borderRadius: 10 }}>
                                <Dumbbell size={16} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700 }}>{log.exercise.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                    {log.exercise.trackingType === 'time' ? 'Time-based' : log.exercise.trackingType}
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-icon" onClick={async () => {
                                await api.workouts.exerciseLogs.update(log.id, { completed: !log.completed });
                                setCurrent(s => ({ ...s, exerciseLogs: s.exerciseLogs.map(l => l.id === log.id ? { ...l, completed: !l.completed } : l) }));
                            }}>
                                <CheckCircle2 size={20} color={log.completed ? 'var(--color-primary)' : 'var(--color-border)'} />
                            </button>
                        </div>
                        <SetLogger
                            logId={log.id}
                            sets={log.sets}
                            trackingType={log.exercise.trackingType}
                            exerciseName={log.exercise.name}
                            prevSets={prevSetsMap[log.exerciseId] || []}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── WORKOUT ANALYTICS ────────────────────────────────────────────────────────

function WorkoutAnalytics({ sessions, exercises }: { sessions: WorkoutSession[]; exercises: Exercise[] }) {
    const [selectedExId, setSelectedExId] = useState<string>('');
    const [exHistory, setExHistory] = useState<any[]>([]);
    const [loadingEx, setLoadingEx] = useState(false);
    const [exPickerOpen, setExPickerOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setExPickerOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!selectedExId) return;
        setLoadingEx(true);
        api.workouts.history(selectedExId).then(h => setExHistory(h)).catch(() => {}).finally(() => setLoadingEx(false));
    }, [selectedExId]);

    // Weekly volume: sessions per week
    const weeklyData = (() => {
        const map: Record<string, { week: string; sessions: number; sets: number }> = {};
        sessions.filter(s => s.status === 'completed').forEach(s => {
            const w = format(startOfWeek(parseISO(s.date), { weekStartsOn: 1 }), 'MMM d');
            if (!map[w]) map[w] = { week: w, sessions: 0, sets: 0 };
            map[w].sessions++;
            map[w].sets += s.exerciseLogs.reduce((acc, l) => acc + (l.sets?.length ?? 0), 0);
        });
        return Object.values(map).slice(-8);
    })();

    // Per-exercise: max weight per session date
    const exProgressData = exHistory.map(log => {
        const maxWeight = Math.max(0, ...(log.sets ?? []).filter((s: any) => s.weight).map((s: any) => s.weight));
        const totalReps = (log.sets ?? []).reduce((acc: number, s: any) => acc + (s.reps ?? 0), 0);
        const totalSets = log.sets?.length ?? 0;
        return {
            date: log.workoutSession?.date ?? '',
            maxWeight: maxWeight || null,
            totalReps,
            totalSets,
        };
    }).filter(d => d.date).reverse();

    const selectedEx = exercises.find(e => e.id === selectedExId);
    const isWeightBased = selectedEx?.trackingType === 'reps_weight';
    const hasHistory = exProgressData.length > 0;

    // Best lifts
    const allCompleted = sessions.filter(s => s.status === 'completed');
    const totalSessions = allCompleted.length;
    const totalSets = allCompleted.reduce((acc, s) => acc + s.exerciseLogs.reduce((a, l) => a + (l.sets?.length ?? 0), 0), 0);
    const streak = (() => {
        const dates = [...new Set(allCompleted.map(s => s.date))].sort().reverse();
        let count = 0;
        let cur = new Date();
        for (const d of dates) {
            const diff = Math.floor((cur.getTime() - parseISO(d).getTime()) / 86400000);
            if (diff <= 1) { count++; cur = parseISO(d); } else break;
        }
        return count;
    })();

    return (
        <div>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
                {[
                    { label: 'Total Sessions', value: totalSessions, color: 'var(--color-primary)' },
                    { label: 'Total Sets', value: totalSets, color: '#3b82f6' },
                    { label: 'Day Streak', value: streak, color: '#f59e0b' },
                ].map(s => (
                    <div key={s.label} className="stat-box">
                        <span className="stat-label">{s.label}</span>
                        <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Weekly volume */}
            {weeklyData.length > 0 ? (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <BarChart2 size={16} color="var(--color-primary)" />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Weekly Volume</span>
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                            <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-3)' }} />
                            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-3)' }} />
                            <Tooltip
                                contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid var(--color-border-light)' }}
                                formatter={(v: any, name: string) => [v, name === 'sets' ? 'Sets' : 'Sessions']}
                            />
                            <Bar dataKey="sessions" fill="var(--color-primary)" radius={[4,4,0,0]} name="sessions" />
                            <Bar dataKey="sets" fill="#93c5fd" radius={[4,4,0,0]} name="sets" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: 14, marginTop: 8, justifyContent: 'center' }}>
                        {[{ color: 'var(--color-primary)', label: 'Sessions' }, { color: '#93c5fd', label: 'Sets' }].map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{l.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="card" style={{ marginBottom: 16, textAlign: 'center', padding: '24px 16px' }}>
                    <BarChart2 size={28} color="var(--color-border)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-3)' }}>Complete workouts to see weekly volume.</p>
                </div>
            )}

            {/* Exercise progression */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <TrendingUp size={16} color="#3b82f6" />
                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Exercise Progression</span>
                </div>

                {/* Exercise picker */}
                <div style={{ position: 'relative', marginBottom: 12 }} ref={pickerRef}>
                    <button
                        onClick={() => setExPickerOpen(v => !v)}
                        style={{
                            width: '100%', padding: '11px 14px',
                            border: `1.5px solid ${exPickerOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)',
                            fontFamily: 'var(--font)', fontSize: '0.9375rem', color: selectedEx ? 'var(--color-text)' : 'var(--color-text-3)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            transition: 'border-color .15s',
                        }}
                    >
                        <span>{selectedEx?.name ?? 'Select an exercise...'}</span>
                        <ChevronDown size={16} color="var(--color-text-3)"
                            style={{ transform: exPickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
                    </button>
                    {exPickerOpen && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                            background: 'var(--color-surface)', border: '1.5px solid var(--color-border)',
                            borderRadius: 'var(--radius-lg)', zIndex: 999, maxHeight: 220, overflowY: 'auto',
                            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
                        }}>
                            {exercises.map(ex => (
                                <button key={ex.id} onClick={() => { setSelectedExId(ex.id); setExPickerOpen(false); }}
                                    style={{
                                        width: '100%', padding: '10px 14px', border: 'none', textAlign: 'left',
                                        background: ex.id === selectedExId ? 'var(--color-primary-bg)' : 'transparent',
                                        color: ex.id === selectedExId ? 'var(--color-primary)' : 'var(--color-text)',
                                        fontFamily: 'var(--font)', fontSize: '0.875rem',
                                        fontWeight: ex.id === selectedExId ? 700 : 400,
                                        cursor: 'pointer', borderBottom: '1px solid var(--color-border-light)', display: 'block',
                                    }}>
                                    <div>{ex.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{ex.category} · {ex.primaryMuscle}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {!selectedExId && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-3)', textAlign: 'center', padding: '12px 0' }}>
                        Pick an exercise to see your progression chart.
                    </p>
                )}
                {selectedExId && loadingEx && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-3)', fontSize: '0.875rem' }}>Loading...</div>
                )}
                {selectedExId && !loadingEx && !hasHistory && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-3)', textAlign: 'center', padding: '12px 0' }}>
                        No logged sets for {selectedEx?.name} yet.
                    </p>
                )}
                {selectedExId && !loadingEx && hasHistory && (
                    <>
                        {/* Best stats row */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 14 }}>
                            {isWeightBased && (
                                <div className="stat-box">
                                    <span className="stat-label">Best Weight</span>
                                    <span className="stat-value" style={{ color: 'var(--color-primary)' }}>
                                        {Math.max(...exProgressData.map(d => d.maxWeight ?? 0))}
                                    </span>
                                    <span className="stat-unit">kg</span>
                                </div>
                            )}
                            <div className="stat-box">
                                <span className="stat-label">Sessions</span>
                                <span className="stat-value" style={{ color: '#3b82f6' }}>{exProgressData.length}</span>
                            </div>
                            <div className="stat-box">
                                <span className="stat-label">Total Reps</span>
                                <span className="stat-value" style={{ color: '#f59e0b' }}>
                                    {exProgressData.reduce((a, d) => a + d.totalReps, 0)}
                                </span>
                            </div>
                        </div>

                        {/* Max weight chart */}
                        {isWeightBased && exProgressData.some(d => d.maxWeight) && (
                            <div style={{ marginBottom: 14 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                                    Max Weight per Session (kg)
                                </div>
                                <ResponsiveContainer width="100%" height={130}>
                                    <LineChart data={exProgressData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-3)' }}
                                            tickFormatter={d => d ? d.slice(5) : ''} interval="preserveStartEnd" />
                                        <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} domain={['auto', 'auto']} />
                                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid var(--color-border-light)' }}
                                            formatter={(v: any) => [`${v} kg`, 'Max Weight']} labelFormatter={l => String(l)} />
                                        <Line type="monotone" dataKey="maxWeight" stroke="var(--color-primary)" strokeWidth={2.5}
                                            dot={{ r: 3, fill: 'var(--color-primary)', strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Reps chart */}
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                                Total Reps per Session
                            </div>
                            <ResponsiveContainer width="100%" height={110}>
                                <BarChart data={exProgressData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-3)' }}
                                        tickFormatter={d => d ? d.slice(5) : ''} interval="preserveStartEnd" />
                                    <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} />
                                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 10, border: '1px solid var(--color-border-light)' }}
                                        formatter={(v: any) => [v, 'Total Reps']} labelFormatter={l => String(l)} />
                                    <Bar dataKey="totalReps" fill="#3b82f6" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── MAIN WORKOUTS VIEW ───────────────────────────────────────────────────────

export default function WorkoutsView() {
    const [tab, setTab] = useState<Tab>('today');
    const [plans, setPlans] = useState<WorkoutPlan[]>([]);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingPlan, setEditingPlan] = useState<WorkoutPlan | undefined>();
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [showLibraryNewEx, setShowLibraryNewEx] = useState(false);
    const [libNewEx, setLibNewEx] = useState({ name: '', category: 'Strength', trackingType: 'reps_weight' as Exercise['trackingType'], equipment: 'Bodyweight', primaryMuscle: 'Chest' });
    const [libCreating, setLibCreating] = useState(false);
    const [prevSetsMap, setPrevSetsMap] = useState<Record<string, any[]>>({});
    const [finishing, setFinishing] = useState(false);
    const today = format(new Date(), 'yyyy-MM-dd');

    const load = async () => {
        try {
            const [p, s, e] = await Promise.all([
                api.workouts.plans.list(),
                api.workouts.sessions.byDate(today),
                api.exercises.list()
            ]);
            setPlans(p);
            setSessions(s);
            setExercises(e);
        } catch {}
    };

    useEffect(() => { load(); }, []);

    useEffect(() => {
        if (!activeSession) return;
        const loadPrev = async () => {
            const map: Record<string, any[]> = {};
            for (const log of activeSession.exerciseLogs) {
                try {
                    const history = await api.workouts.history(log.exerciseId);
                    if (history.length > 0) map[log.exerciseId] = history[0].sets || [];
                } catch {}
            }
            setPrevSetsMap(map);
        };
        loadPrev();
    }, [activeSession?.id]);

    const finishSession = async () => {
        if (!activeSession) return;
        setFinishing(true);
        try {
            await api.workouts.sessions.complete(activeSession.id);
            await load();
            setActiveSession(null);
        } catch {} finally { setFinishing(false); }
    };

    const createLibraryExercise = async () => {
        if (!libNewEx.name.trim()) return;
        setLibCreating(true);
        try {
            await api.exercises.create({
                name: libNewEx.name.trim(),
                category: libNewEx.category,
                trackingType: libNewEx.trackingType,
                equipment: libNewEx.equipment,
                primaryMuscle: libNewEx.primaryMuscle,
                secondaryMuscles: [],
                bodyPartFocus: libNewEx.primaryMuscle,
                isSystem: false,
            });
            await load();
            setShowLibraryNewEx(false);
            setLibNewEx({ name: '', category: 'Strength', trackingType: 'reps_weight', equipment: 'Bodyweight', primaryMuscle: 'Chest' });
        } catch {} finally { setLibCreating(false); }
    };

    const startSession = async (plan: WorkoutPlan) => {
        try {
            const session = await api.workouts.sessions.create({ workoutPlanId: plan.id, date: today });
            const fullSession = { ...session, exerciseLogs: [] as any[], workoutPlan: { name: plan.name } };
            for (const pe of plan.exercises) {
                const log = await api.workouts.sessions.addLog(session.id, {
                    exerciseId: pe.exerciseId,
                    orderIndex: pe.orderIndex
                });
                fullSession.exerciseLogs.push({ ...log, exercise: pe.exercise, sets: [] });
            }
            setSessions(prev => [...prev, fullSession as WorkoutSession]);
            setActiveSession(fullSession as WorkoutSession);
            setTab('today');
        } catch {}
    };

    const cats = [...new Set(exercises.map(e => e.category))].sort();
    const filtered = exercises.filter(e =>
        (!catFilter || e.category === catFilter) &&
        (!search || e.name.toLowerCase().includes(search.toLowerCase()) || e.primaryMuscle.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Workouts</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowBuilder(true)}>
                    <Plus size={15} /> New Plan
                </button>
            </div>

            <div className="tab-bar" style={{ marginBottom: 16 }}>
                {(['today', 'plans', 'library', 'analytics'] as Tab[]).map(t => (
                    <button key={t} className={`tab-item${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                        {t === 'today' ? 'Today' : t === 'plans' ? 'Plans' : t === 'library' ? 'Library' : 'Analytics'}
                    </button>
                ))}
            </div>

            {tab === 'today' && (
                <div>
                    {/* Active in-progress session */}
                    {activeSession && (
                        <div className="card" style={{ marginBottom: 16, border: '2px solid var(--color-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div className="exercise-icon" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                                    <Dumbbell size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{activeSession.workoutPlan?.name || 'Workout'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                        {activeSession.exerciseLogs.length} exercises · In progress
                                    </div>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={finishSession} disabled={finishing}>
                                    <CheckCircle2 size={14} /> {finishing ? 'Saving...' : 'Finish'}
                                </button>
                            </div>

                            {activeSession.exerciseLogs.map((log) => (
                                <div key={log.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-border-light)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{log.exercise.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                                {getMajorGroup(log.exercise.primaryMuscle ?? '')} · {log.exercise.trackingType === 'time' ? 'Time-based' : log.exercise.trackingType === 'reps_only' ? 'Reps only' : 'Reps + Weight'}
                                            </div>
                                        </div>
                                        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={async () => {
                                            await api.workouts.exerciseLogs.update(log.id, { completed: !log.completed });
                                            setActiveSession(s => s ? { ...s, exerciseLogs: s.exerciseLogs.map(l => l.id === log.id ? { ...l, completed: !l.completed } : l) } : s);
                                        }}>
                                            <CheckCircle2 size={20} color={log.completed ? 'var(--color-primary)' : 'var(--color-border)'} />
                                        </button>
                                    </div>
                                    <SetLogger
                                        logId={log.id}
                                        sets={log.sets}
                                        trackingType={log.exercise.trackingType}
                                        exerciseName={log.exercise.name}
                                        prevSets={prevSetsMap[log.exerciseId] || []}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Completed sessions */}
                    {sessions.filter(s => s.status === 'completed').map(s => (
                        <div key={s.id} className="card card-compact" style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="exercise-icon"><Dumbbell size={18} /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700 }}>{s.workoutPlan?.name || 'Workout'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                        {s.exerciseLogs.length} exercises
                                    </div>
                                </div>
                                <span className="badge badge-green"><CheckCircle2 size={12} /> Done</span>
                            </div>
                        </div>
                    ))}

                    {!activeSession && sessions.filter(s => s.status === 'completed').length === 0 && (
                        <div className="empty-state">
                            <div className="empty-state-icon"><Dumbbell size={24} /></div>
                            <h3 style={{ marginBottom: 8 }}>No workouts today</h3>
                            <p style={{ fontSize: '0.875rem' }}>Start a plan from the Plans section.</p>
                        </div>
                    )}

                    {!activeSession && (
                        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--color-surface-2)', fontSize: '0.8125rem', color: 'var(--color-text-3)', textAlign: 'center' }}>
                            To start a workout, go to the <strong style={{ color: 'var(--color-text-2)' }}>Plans</strong> tab
                        </div>
                    )}
                </div>
            )}

            {tab === 'plans' && (
                <div>
                    {plans.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><Dumbbell size={24} /></div>
                            <h3 style={{ marginBottom: 8 }}>No workout plans</h3>
                            <p style={{ fontSize: '0.875rem' }}>Create your first plan.</p>
                        </div>
                    ) : (
                        plans.map(p => (
                            <div key={p.id} className="card card-compact" style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="exercise-icon"><Dumbbell size={18} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                            {p.exercises.length} exercises
                                            {p.isTemplate ? ' · Template' : p.date ? ` · ${p.date}` : ''}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => startSession(p)}>
                                            <Play size={13} /> Start
                                        </button>
                                        <button className="btn btn-ghost btn-icon" onClick={() => { setEditingPlan(p); setShowBuilder(true); }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon" onClick={async () => {
                                            if (confirm('Delete this plan?')) { await api.workouts.plans.delete(p.id); load(); }
                                        }}>
                                            <Trash2 size={14} color="var(--color-text-3)" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tab === 'library' && (
                <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                            <input className="input" placeholder="Search exercises..." value={search}
                                onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                        </div>
                        <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}
                            onClick={() => setShowLibraryNewEx(v => !v)}>
                            <Plus size={14} /> New
                        </button>
                    </div>

                    {showLibraryNewEx && (
                        <div className="card" style={{ marginBottom: 12, border: '1.5px solid var(--color-primary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-primary)' }}>New Exercise</div>
                            <input className="input" placeholder="Exercise name" value={libNewEx.name}
                                onChange={e => setLibNewEx(n => ({ ...n, name: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && createLibraryExercise()} autoFocus />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <CustomSelect label="Category" value={libNewEx.category}
                                    options={['Strength','Cardio','Flexibility','Balance','Sports','Other'].map(c => ({ value: c, label: c }))}
                                    onChange={v => setLibNewEx(n => ({ ...n, category: v }))} />
                                <CustomSelect label="Muscle Target" value={libNewEx.primaryMuscle}
                                    options={['Chest','Back','Shoulders','Biceps','Triceps','Core','Quads','Hamstrings','Glutes','Calves','Full Body'].map(m => ({ value: m, label: m }))}
                                    onChange={v => setLibNewEx(n => ({ ...n, primaryMuscle: v }))} />
                                <CustomSelect label="Tracking" value={libNewEx.trackingType}
                                    options={[
                                        { value: 'reps_weight', label: 'Reps + Weight' },
                                        { value: 'reps_only',   label: 'Reps only' },
                                        { value: 'time',        label: 'Time' },
                                        { value: 'distance',    label: 'Distance' },
                                    ]}
                                    onChange={v => setLibNewEx(n => ({ ...n, trackingType: v as Exercise['trackingType'] }))} />
                                <CustomSelect label="Equipment" value={libNewEx.equipment}
                                    options={['Bodyweight','Barbell','Dumbbell','Machine','Cable','Resistance Band','Kettlebell','Other'].map(eq => ({ value: eq, label: eq }))}
                                    onChange={v => setLibNewEx(n => ({ ...n, equipment: v }))} />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={() => setShowLibraryNewEx(false)}>Cancel</button>
                                <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                                    onClick={createLibraryExercise} disabled={libCreating || !libNewEx.name.trim()}>
                                    {libCreating ? 'Saving...' : 'Save Exercise'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 12 }}>
                        <button onClick={() => setCatFilter('')}
                            className={`badge ${!catFilter ? 'badge-green' : 'badge-gray'}`} style={{ cursor: 'pointer', border: 'none' }}>
                            All
                        </button>
                        {cats.map(c => (
                            <button key={c} onClick={() => setCatFilter(catFilter === c ? '' : c)}
                                className={`badge ${catFilter === c ? 'badge-green' : 'badge-gray'}`} style={{ cursor: 'pointer', border: 'none', whiteSpace: 'nowrap' }}>
                                {c}
                            </button>
                        ))}
                    </div>
                    {filtered.map(ex => (
                        <div key={ex.id} className="exercise-card" style={{ marginBottom: 6 }}
                            onClick={() => setSelectedExercise(ex)}>
                            <div className="exercise-icon"><Dumbbell size={18} /></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ex.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                    {ex.category} · {ex.primaryMuscle}
                                </div>
                            </div>
                            <ChevronRight size={16} color="var(--color-text-3)" />
                        </div>
                    ))}
                </div>
            )}

            {tab === 'analytics' && (
                <WorkoutAnalytics sessions={sessions} exercises={exercises} />
            )}

            {showBuilder && <WorkoutPlanBuilder onClose={() => { setShowBuilder(false); setEditingPlan(undefined); }} onSaved={load} editing={editingPlan} />}
            {selectedExercise && <ExerciseDetailModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />}
        </div>
    );
}
