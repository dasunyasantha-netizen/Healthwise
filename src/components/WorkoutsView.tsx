import { useState, useEffect } from 'react';
import { Plus, Dumbbell, Search, ChevronRight, X, Play, CheckCircle2, ExternalLink, Trash2, Timer, RotateCcw, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../services/api';
import { Exercise, WorkoutPlan, WorkoutSession } from '../types';

type Tab = 'today' | 'plans' | 'library';

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
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase())
    );

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
        <div className="modal-overlay">
            <div className="modal-sheet" style={{ maxHeight: '95dvh' }}>
                <div className="modal-handle" />
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
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {s.exercise.trackingType === 'time' ? (
                                                <input className="set-input" type="number" placeholder="sec"
                                                    value={s.targetTimeSeconds || ''} style={{ width: 60 }}
                                                    onChange={e => setSelected(prev => prev.map(x => x.exercise.id === s.exercise.id ? { ...x, targetTimeSeconds: parseInt(e.target.value) || 0 } : x))} />
                                            ) : (
                                                <>
                                                    <input className="set-input" type="number" placeholder="sets"
                                                        value={s.targetSets || ''} style={{ width: 48 }}
                                                        onChange={e => setSelected(prev => prev.map(x => x.exercise.id === s.exercise.id ? { ...x, targetSets: parseInt(e.target.value) || 0 } : x))} />
                                                    <input className="set-input" type="number" placeholder="reps"
                                                        value={s.targetReps || ''} style={{ width: 48 }}
                                                        onChange={e => setSelected(prev => prev.map(x => x.exercise.id === s.exercise.id ? { ...x, targetReps: parseInt(e.target.value) || 0 } : x))} />
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
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="label">Category</label>
                                        <select className="input" value={newEx.category} onChange={e => setNewEx(n => ({ ...n, category: e.target.value }))}>
                                            {['Strength','Cardio','Flexibility','Balance','Sports','Other'].map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="label">Muscle Target</label>
                                        <select className="input" value={newEx.primaryMuscle} onChange={e => setNewEx(n => ({ ...n, primaryMuscle: e.target.value }))}>
                                            {['Chest','Back','Shoulders','Biceps','Triceps','Core','Quads','Hamstrings','Glutes','Calves','Full Body'].map(m => <option key={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="label">Tracking</label>
                                        <select className="input" value={newEx.trackingType} onChange={e => setNewEx(n => ({ ...n, trackingType: e.target.value as Exercise['trackingType'] }))}>
                                            <option value="reps_weight">Reps + Weight</option>
                                            <option value="reps_only">Reps only</option>
                                            <option value="time">Time</option>
                                            <option value="distance">Distance</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="label">Equipment</label>
                                        <select className="input" value={newEx.equipment} onChange={e => setNewEx(n => ({ ...n, equipment: e.target.value }))}>
                                            {['Bodyweight','Barbell','Dumbbell','Machine','Cable','Resistance Band','Kettlebell','Other'].map(eq => <option key={eq}>{eq}</option>)}
                                        </select>
                                    </div>
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

                        <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filtered.length === 0 && !showNewEx && (
                                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-3)', fontSize: '0.875rem' }}>
                                    No exercises found.{' '}
                                    <button className="btn-ghost" style={{ color: 'var(--color-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                                        onClick={() => { setShowNewEx(true); setNewEx(n => ({ ...n, name: search })); }}>
                                        Create "{search}"
                                    </button>
                                </div>
                            )}
                            {filtered.map(ex => {
                                const isAdded = selected.some(s => s.exercise.id === ex.id);
                                return (
                                    <div key={ex.id} className="exercise-card" onClick={() => addExercise(ex)}
                                        style={{ opacity: isAdded ? 0.5 : 1 }}>
                                        <div className="exercise-icon"><Dumbbell size={18} /></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ex.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{ex.category} · {ex.equipment}</div>
                                        </div>
                                        {isAdded ? <CheckCircle2 size={18} color="var(--color-primary)" /> : <Plus size={16} color="var(--color-text-3)" />}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button className="btn btn-ghost" onClick={() => setStep('info')}>← Back</button>
                            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                                onClick={save} disabled={saving || selected.length === 0}>
                                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Plan'}
                            </button>
                        </div>
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

    const startSession = async (plan: WorkoutPlan) => {
        try {
            const session = await api.workouts.sessions.create({ workoutPlanId: plan.id, date: today });
            // Add exercise logs from plan
            const fullSession = { ...session, exerciseLogs: [] as any[], workoutPlan: { name: plan.name } };
            for (const pe of plan.exercises) {
                const log = await api.workouts.sessions.addLog(session.id, {
                    exerciseId: pe.exerciseId,
                    orderIndex: pe.orderIndex
                });
                fullSession.exerciseLogs.push({ ...log, exercise: pe.exercise, sets: [] });
            }
            setActiveSession(fullSession as WorkoutSession);
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
                {(['today', 'plans', 'library'] as Tab[]).map(t => (
                    <button key={t} className={`tab-item${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                        {t === 'today' ? 'Today' : t === 'plans' ? 'Plans' : 'Library'}
                    </button>
                ))}
            </div>

            {tab === 'today' && (
                <div>
                    {sessions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><Dumbbell size={24} /></div>
                            <h3 style={{ marginBottom: 8 }}>No sessions today</h3>
                            <p style={{ fontSize: '0.875rem' }}>Start from a plan or create a new one.</p>
                        </div>
                    ) : (
                        sessions.map(s => (
                            <div key={s.id} className="card card-compact" style={{ marginBottom: 10 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="exercise-icon"><Dumbbell size={18} /></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700 }}>{s.workoutPlan?.name || 'Workout'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                            {s.exerciseLogs.length} exercises · {s.status}
                                        </div>
                                    </div>
                                    {s.status !== 'completed' && (
                                        <button className="btn btn-primary btn-sm" onClick={() => setActiveSession(s)}>
                                            <Play size={13} /> Resume
                                        </button>
                                    )}
                                    {s.status === 'completed' && (
                                        <span className="badge badge-green"><CheckCircle2 size={12} /> Done</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {plans.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <div className="section-title">Start from a Plan</div>
                            {plans.filter(p => p.isTemplate || p.date === today).slice(0, 5).map(p => (
                                <div key={p.id} className="card card-compact" style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                                {p.exercises.length} exercises
                                                {p.isTemplate && ' · Template'}
                                            </div>
                                        </div>
                                        <button className="btn btn-secondary btn-sm" onClick={() => startSession(p)}>
                                            <Play size={13} /> Start
                                        </button>
                                    </div>
                                </div>
                            ))}
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
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)' }} />
                        <input className="input" placeholder="Search exercises..." value={search}
                            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
                    </div>
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

            {showBuilder && <WorkoutPlanBuilder onClose={() => { setShowBuilder(false); setEditingPlan(undefined); }} onSaved={load} editing={editingPlan} />}
            {selectedExercise && <ExerciseDetailModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} />}
            {activeSession && <SessionRunner session={activeSession} onClose={() => setActiveSession(null)} onComplete={load} />}
        </div>
    );
}
