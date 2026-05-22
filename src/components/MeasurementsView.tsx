import { useState, useEffect } from 'react';
import { Plus, X, Ruler, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';
import { HealthMeasurement } from '../types';

type Tab = 'latest' | 'form' | 'charts';

function MeasurementForm({ onClose, onSaved, editing }: { onClose: () => void; onSaved: () => void; editing?: HealthMeasurement }) {
    const s = (v: number | null | undefined) => v != null ? String(v) : '';
    const [form, setForm] = useState({
        date: editing?.date ?? format(new Date(), 'yyyy-MM-dd'),
        weight: s(editing?.weight), height: s(editing?.height),
        waist: s(editing?.waist), chest: s(editing?.chest),
        hip: s(editing?.hip), neck: s(editing?.neck),
        leftArm: s(editing?.leftArm), rightArm: s(editing?.rightArm),
        leftThigh: s(editing?.leftThigh), rightThigh: s(editing?.rightThigh),
        bodyFatPercentage: s(editing?.bodyFatPercentage),
        restingHeartRate: s(editing?.restingHeartRate),
        systolicBp: s(editing?.systolicBp), diastolicBp: s(editing?.diastolicBp),
        spo2: s(editing?.spo2), bodyTemperature: s(editing?.bodyTemperature),
        fastingGlucose: s(editing?.fastingGlucose),
        notes: editing?.notes ?? ''
    });
    const [saving, setSaving] = useState(false);

    const n = (v: string) => v ? parseFloat(v) : null;
    const ni = (v: string) => v ? parseInt(v) : null;

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                date: form.date,
                weight: n(form.weight), height: n(form.height),
                waist: n(form.waist), chest: n(form.chest),
                hip: n(form.hip), neck: n(form.neck),
                leftArm: n(form.leftArm), rightArm: n(form.rightArm),
                leftThigh: n(form.leftThigh), rightThigh: n(form.rightThigh),
                bodyFatPercentage: n(form.bodyFatPercentage),
                restingHeartRate: ni(form.restingHeartRate),
                systolicBp: ni(form.systolicBp), diastolicBp: ni(form.diastolicBp),
                spo2: n(form.spo2), bodyTemperature: n(form.bodyTemperature),
                fastingGlucose: n(form.fastingGlucose),
                notes: form.notes || null
            };
            if (editing) {
                await api.measurements.update(editing.id, payload);
            } else {
                await api.measurements.create(payload);
            }
            onSaved(); onClose();
        } finally { setSaving(false); }
    };

    const field = (label: string, key: keyof typeof form, placeholder: string, unit?: string) => (
        <div className="form-group">
            <label className="label">{label}{unit ? ` (${unit})` : ''}</label>
            <input className="input" type="number" step="0.1" placeholder={placeholder}
                value={form[key] as string}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
        </div>
    );

    return (
        <div className="modal-overlay" style={{ alignItems: 'flex-start', overflowY: 'auto' }}>
            <div style={{
                background: 'var(--color-surface)', width: '100%',
                minHeight: '100%', padding: '20px 16px 40px',
                borderRadius: 0, flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2>{editing ? 'Edit Measurements' : 'Log Measurements'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="label">Date</label>
                    <input className="input" type="date" value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>

                <div className="section-title">Body Metrics</div>
                <div className="grid-2" style={{ marginBottom: 16 }}>
                    {field('Weight', 'weight', '70', 'kg')}
                    {field('Height', 'height', '170', 'cm')}
                    {field('Body Fat %', 'bodyFatPercentage', '15', '%')}
                </div>

                <div className="section-title" style={{ marginTop: 8 }}>Circumference Measurements</div>
                <div className="grid-2" style={{ marginBottom: 16 }}>
                    {field('Waist', 'waist', '80', 'cm')}
                    {field('Chest', 'chest', '95', 'cm')}
                    {field('Hip', 'hip', '90', 'cm')}
                    {field('Neck', 'neck', '37', 'cm')}
                    {field('Left Arm', 'leftArm', '32', 'cm')}
                    {field('Right Arm', 'rightArm', '32', 'cm')}
                    {field('Left Thigh', 'leftThigh', '55', 'cm')}
                    {field('Right Thigh', 'rightThigh', '55', 'cm')}
                </div>

                <div className="section-title" style={{ marginTop: 8 }}>Vitals</div>
                <div className="grid-2" style={{ marginBottom: 16 }}>
                    {field('Resting HR', 'restingHeartRate', '65', 'bpm')}
                    {field('Systolic BP', 'systolicBp', '120', 'mmHg')}
                    {field('Diastolic BP', 'diastolicBp', '80', 'mmHg')}
                    {field('SpO2', 'spo2', '98', '%')}
                    {field('Body Temp', 'bodyTemperature', '36.5', '°C')}
                    {field('Fasting Glucose', 'fastingGlucose', '5.5', 'mmol/L')}
                </div>

                <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="label">Notes</label>
                    <textarea className="input" rows={2} style={{ resize: 'none' }} value={form.notes}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }}
                    onClick={save} disabled={saving}>
                    {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Measurements'}
                </button>
            </div>
        </div>
    );
}

function Trend({ current, prev }: { current?: number | null; prev?: number | null }) {
    if (!current || !prev || current === prev) return null;
    const diff = current - prev;
    const isUp = diff > 0;
    return (
        <span style={{
            fontSize: '0.75rem', fontWeight: 600,
            color: isUp ? 'var(--color-danger)' : 'var(--color-success)',
            display: 'inline-flex', alignItems: 'center', gap: 2
        }}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {isUp ? '+' : ''}{diff.toFixed(1)}
        </span>
    );
}

export default function MeasurementsView() {
    const [tab, setTab] = useState<Tab>('latest');
    const [showForm, setShowForm] = useState(false);
    const [editingMeasurement, setEditingMeasurement] = useState<HealthMeasurement | undefined>();
    const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
    const [latestStatus, setLatestStatus] = useState<any>(null);
    const [trends, setTrends] = useState<HealthMeasurement[]>([]);

    const load = async () => {
        try {
            const [list, ls, tr] = await Promise.all([
                api.measurements.list(),
                api.measurements.latest(),
                api.measurements.trends()
            ]);
            setMeasurements(list);
            setLatestStatus(ls);
            setTrends(tr);
        } catch {}
    };

    useEffect(() => { load(); }, []);

    const latest = measurements[0];
    const prev = measurements[1];

    const chartData = trends.map(m => ({
        date: m.date,
        weight: m.weight,
        waist: m.waist,
        bodyFat: m.bodyFatPercentage,
        systolic: m.systolicBp,
        diastolic: m.diastolicBp,
        hr: m.restingHeartRate
    }));

    const MeasureRow = ({ label, value, prevVal, unit }: { label: string; value?: number | null; prevVal?: number | null; unit: string }) => {
        if (!value) return null;
        return (
            <div className="measure-item">
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{value}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{unit}</span>
                    <Trend current={value} prev={prevVal} />
                </div>
            </div>
        );
    };

    return (
        <div className="page">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2>Measurements</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                    <Plus size={15} /> Log
                </button>
            </div>

            {latestStatus?.status && (
                <div className="card" style={{
                    marginBottom: 16,
                    borderColor: latestStatus.status === 'overdue' ? 'var(--color-warning)' : 'var(--color-border-light)',
                    background: latestStatus.status === 'overdue' ? '#fffbeb' : 'var(--color-surface)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {latestStatus.status === 'overdue'
                            ? <AlertTriangle size={20} color="var(--color-warning)" />
                            : <CheckCircle2 size={20} color="var(--color-primary)" />
                        }
                        <div>
                            <div style={{ fontWeight: 700 }}>
                                {latestStatus.status === 'overdue' ? 'Update Overdue' : 'On Track'}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-2)' }}>{latestStatus.message}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="tab-bar" style={{ marginBottom: 16 }}>
                <button className={`tab-item${tab === 'latest' ? ' active' : ''}`} onClick={() => setTab('latest')}>Latest</button>
                <button className={`tab-item${tab === 'charts' ? ' active' : ''}`} onClick={() => setTab('charts')}>Charts</button>
            </div>

            {tab === 'latest' && (
                <div>
                    {!latest ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><Ruler size={24} /></div>
                            <h3 style={{ marginBottom: 8 }}>No measurements yet</h3>
                            <p style={{ fontSize: '0.875rem' }}>Track your body changes over time.</p>
                            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
                                <Plus size={14} /> Add First Measurement
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ fontWeight: 700 }}>Latest: {latest.date}</div>
                                {prev && <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)' }}>vs {prev.date}</div>}
                            </div>

                            {(latest.weight || latest.bmi || latest.bodyFatPercentage) && (
                                <>
                                    <div className="section-title">Body</div>
                                    <div className="measure-grid" style={{ marginBottom: 14 }}>
                                        <MeasureRow label="Weight" value={latest.weight} prevVal={prev?.weight} unit="kg" />
                                        <MeasureRow label="BMI" value={latest.bmi} prevVal={prev?.bmi} unit="" />
                                        <MeasureRow label="Body Fat" value={latest.bodyFatPercentage} prevVal={prev?.bodyFatPercentage} unit="%" />
                                    </div>
                                </>
                            )}

                            {(latest.waist || latest.chest || latest.hip) && (
                                <>
                                    <div className="section-title">Circumference</div>
                                    <div className="measure-grid" style={{ marginBottom: 14 }}>
                                        <MeasureRow label="Waist" value={latest.waist} prevVal={prev?.waist} unit="cm" />
                                        <MeasureRow label="Chest" value={latest.chest} prevVal={prev?.chest} unit="cm" />
                                        <MeasureRow label="Hip" value={latest.hip} prevVal={prev?.hip} unit="cm" />
                                        <MeasureRow label="Neck" value={latest.neck} prevVal={prev?.neck} unit="cm" />
                                        <MeasureRow label="L Arm" value={latest.leftArm} prevVal={prev?.leftArm} unit="cm" />
                                        <MeasureRow label="R Arm" value={latest.rightArm} prevVal={prev?.rightArm} unit="cm" />
                                        <MeasureRow label="L Thigh" value={latest.leftThigh} prevVal={prev?.leftThigh} unit="cm" />
                                        <MeasureRow label="R Thigh" value={latest.rightThigh} prevVal={prev?.rightThigh} unit="cm" />
                                    </div>
                                </>
                            )}

                            {(latest.restingHeartRate || latest.systolicBp || latest.spo2) && (
                                <>
                                    <div className="section-title">Vitals</div>
                                    <div className="measure-grid" style={{ marginBottom: 14 }}>
                                        <MeasureRow label="Resting HR" value={latest.restingHeartRate} prevVal={prev?.restingHeartRate} unit="bpm" />
                                        <MeasureRow label="Systolic BP" value={latest.systolicBp} prevVal={prev?.systolicBp} unit="mmHg" />
                                        <MeasureRow label="Diastolic BP" value={latest.diastolicBp} prevVal={prev?.diastolicBp} unit="mmHg" />
                                        <MeasureRow label="SpO2" value={latest.spo2} prevVal={prev?.spo2} unit="%" />
                                        <MeasureRow label="Temp" value={latest.bodyTemperature} prevVal={prev?.bodyTemperature} unit="°C" />
                                        <MeasureRow label="Glucose" value={latest.fastingGlucose} prevVal={prev?.fastingGlucose} unit="mmol/L" />
                                    </div>
                                </>
                            )}

                            <div className="section-title" style={{ marginTop: 8 }}>History</div>
                            {measurements.slice(0, 10).map(m => (
                                <div key={m.id} className="card card-compact" style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{m.date}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', display: 'flex', gap: 10, marginTop: 2 }}>
                                                {m.weight && <span>{m.weight} kg</span>}
                                                {m.bmi && <span>BMI {m.bmi}</span>}
                                                {m.restingHeartRate && <span>{m.restingHeartRate} bpm</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 2 }}>
                                            <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                                                onClick={() => { setEditingMeasurement(m); setShowForm(true); }}>
                                                <Pencil size={14} color="var(--color-text-3)" />
                                            </button>
                                            <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}
                                                onClick={async () => { if (confirm('Delete?')) { await api.measurements.delete(m.id); load(); } }}>
                                                <Trash2 size={14} color="var(--color-text-3)" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {tab === 'charts' && (
                <div>
                    {chartData.length < 2 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><TrendingUp size={24} /></div>
                            <h3 style={{ marginBottom: 8 }}>Need more data</h3>
                            <p style={{ fontSize: '0.875rem' }}>Log at least 2 measurements to see trends.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {chartData.some(d => d.weight) && (
                                <div className="card">
                                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Weight (kg)</div>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                                            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {chartData.some(d => d.waist) && (
                                <div className="card">
                                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Waist (cm)</div>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                                            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="waist" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {chartData.some(d => d.systolic || d.diastolic) && (
                                <div className="card">
                                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Blood Pressure (mmHg)</div>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
                                            <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {chartData.some(d => d.hr) && (
                                <div className="card">
                                    <div style={{ fontWeight: 700, marginBottom: 12 }}>Resting Heart Rate (bpm)</div>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                                            <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="hr" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showForm && <MeasurementForm onClose={() => { setShowForm(false); setEditingMeasurement(undefined); }} onSaved={load} editing={editingMeasurement} />}
        </div>
    );
}
