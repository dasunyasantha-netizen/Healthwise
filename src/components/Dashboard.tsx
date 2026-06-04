import { useEffect, useState } from 'react';
import { RefreshCw, Dumbbell, UtensilsCrossed, Timer, Ruler, Flame, CheckCircle2, TrendingDown, TrendingUp, ShieldCheck, Heart, Activity } from 'lucide-react';
import { format, subDays, parseISO, startOfWeek, differenceInDays } from 'date-fns';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, AreaChart, Area, ScatterChart, Scatter, Cell,
} from 'recharts';
import { DashboardData, HealthMeasurement, ViewMode, WorkoutSession } from '../types';
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

// ─── BMI GAUGE ────────────────────────────────────────────────────────────────

function BmiGauge({ bmi, weight }: { bmi: number; weight?: number }) {
    const zones = [
        { label: 'Underweight', max: 18.5, color: '#60a5fa', bg: '#eff6ff' },
        { label: 'Normal',      max: 25,   color: '#00c875', bg: '#d1fae5' },
        { label: 'Overweight',  max: 30,   color: '#f59e0b', bg: '#fef3c7' },
        { label: 'Obese',       max: 100,  color: '#ef4444', bg: '#fee2e2' },
    ];
    const clamp = Math.min(Math.max(bmi, 14), 40);
    const pct = ((clamp - 14) / (40 - 14)) * 100;
    const zone = zones.find(z => bmi < z.max) ?? zones[zones.length - 1];
    const isNormal = bmi >= 18.5 && bmi < 25;

    let targetMin: number | null = null;
    let targetMax: number | null = null;
    let kgDelta: number | null = null;
    if (weight && bmi) {
        const hM = Math.sqrt(weight / bmi);
        targetMin = Math.round(18.5 * hM * hM * 10) / 10;
        targetMax = Math.round(24.9 * hM * hM * 10) / 10;
        if (bmi >= 25) kgDelta = Math.round((weight - targetMax) * 10) / 10;
        if (bmi < 18.5) kgDelta = Math.round((targetMin - weight) * 10) / 10;
    }

    const advice = (() => {
        if (isNormal) return { icon: ShieldCheck, text: "Great work — your BMI is in the healthy range! Keep up the balanced diet and regular movement to maintain it.", color: '#00c875' };
        if (bmi < 18.5) return { icon: TrendingUp, text: `A little extra fuel can go a long way! Try adding nutrient-dense foods and some strength training to your routine.${kgDelta ? ` Gaining around ${kgDelta} kg would put you in the healthy range.` : ''}`, color: '#60a5fa' };
        if (bmi < 30) return { icon: TrendingDown, text: `You're making progress just by tracking! Small, consistent changes — like a short daily walk and lighter meals — can make a big difference.${kgDelta ? ` Around ${kgDelta} kg would bring you into the healthy range.` : ''}`, color: '#f59e0b' };
        return { icon: TrendingDown, text: `Every step in the right direction counts. Focus on gradual, sustainable habits — even small changes add up over time.${kgDelta ? ` A goal of ${kgDelta} kg would put you in a healthier range.` : ''} Consider chatting with a healthcare provider for personalised guidance.`, color: '#ef4444' };
    })();
    const AdviceIcon = advice.icon;

    return (
        <div className="card" style={{ marginBottom: 14, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Body Mass Index</div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: zone.color, background: zone.bg, padding: '2px 10px', borderRadius: 20 }}>{zone.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, lineHeight: 1, color: zone.color }}>{bmi.toFixed(1)}</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', fontWeight: 500 }}>BMI</span>
                {targetMin && targetMax && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-3)' }}>Healthy: {targetMin}–{targetMax} kg</span>
                )}
            </div>
            <div style={{ position: 'relative', height: 10, borderRadius: 6, overflow: 'visible', marginBottom: 4 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 6, overflow: 'hidden', background: 'linear-gradient(to right, #60a5fa 0%, #00c875 33%, #f59e0b 60%, #ef4444 100%)' }} />
                <div style={{ position: 'absolute', top: -3, left: `${pct}%`, transform: 'translateX(-50%)', width: 16, height: 16, borderRadius: '50%', background: '#fff', border: `3px solid ${zone.color}`, boxShadow: `0 1px 6px ${zone.color}55` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                {[{ v: '14', l: '' }, { v: '18.5', l: 'Under' }, { v: '25', l: 'Normal' }, { v: '30', l: 'Over' }, { v: '40', l: 'Obese' }].map(({ v, l }) => (
                    <div key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-text-3)' }}>{v}</span>
                        <span style={{ fontSize: '0.55rem', color: 'var(--color-text-3)', opacity: 0.7 }}>{l}</span>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: zone.bg, borderRadius: 'var(--radius-lg)', alignItems: 'flex-start' }}>
                <AdviceIcon size={16} color={advice.color} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.8125rem', color: advice.color, lineHeight: 1.55, fontWeight: 500, margin: 0 }}>{advice.text}</p>
            </div>
        </div>
    );
}

// ─── WAIST-TO-HIP RATIO ───────────────────────────────────────────────────────

function WHRCard({ waist, hip }: { waist: number; hip: number }) {
    const ratio = Math.round((waist / hip) * 1000) / 1000;
    const classify = (r: number) => {
        if (r < 0.80) return { label: 'Low Risk', color: '#00c875', bg: '#d1fae5', desc: 'Healthy fat distribution. Keep maintaining your current routine.' };
        if (r < 0.85) return { label: 'Moderate Risk', color: '#f59e0b', bg: '#fef3c7', desc: 'Slight central fat accumulation. Focus on core exercises and reducing refined carbs.' };
        return { label: 'High Risk', color: '#ef4444', bg: '#fee2e2', desc: 'Elevated cardiovascular risk. Prioritise cardio, reduce visceral fat through diet and movement.' };
    };
    const { label, color, bg, desc } = classify(ratio);
    const pct = Math.min(Math.max((ratio - 0.6) / (1.1 - 0.6), 0), 1) * 100;

    return (
        <div className="card" style={{ marginBottom: 14, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Waist-to-Hip Ratio</div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color, background: bg, padding: '2px 10px', borderRadius: 20 }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color }}>{ratio.toFixed(2)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>{waist} cm waist · {hip} cm hip</span>
            </div>
            <div style={{ position: 'relative', height: 8, borderRadius: 4, overflow: 'visible', marginBottom: 4 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 4, overflow: 'hidden', background: 'linear-gradient(to right, #00c875 0%, #f59e0b 55%, #ef4444 100%)' }} />
                <div style={{ position: 'absolute', top: -4, left: `${pct}%`, transform: 'translateX(-50%)', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: `3px solid ${color}`, boxShadow: `0 1px 6px ${color}55` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                {[{ v: '0.6', l: 'Low' }, { v: '0.8', l: 'Mod' }, { v: '0.85', l: 'High' }, { v: '1.1', l: '' }].map(x => (
                    <span key={x.v} style={{ fontSize: '0.6rem', color: 'var(--color-text-3)' }}>{x.v}</span>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '8px 10px', background: bg, borderRadius: 'var(--radius-lg)' }}>
                <Heart size={14} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: '0.8rem', color, lineHeight: 1.5, fontWeight: 500, margin: 0 }}>{desc}</p>
            </div>
        </div>
    );
}

// ─── BODY COMPOSITION CHART (Lean vs Fat mass) ────────────────────────────────

function BodyCompositionChart({ trends }: { trends: any[] }) {
    const data = trends.filter(t => t.weight != null && t.bodyFat != null).map(t => ({
        date: t.date,
        fat: Math.round(t.weight * (t.bodyFat / 100) * 10) / 10,
        lean: Math.round(t.weight * (1 - t.bodyFat / 100) * 10) / 10,
    }));
    if (data.length < 1) return null;

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px 10px' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Body Composition</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>■ Lean Mass</span>
                <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>■ Fat Mass</span>
            </div>
            <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} tickFormatter={d => d ? d.slice(5) : ''} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-border-light)' }}
                        labelFormatter={l => String(l).replace(/-/g, '/')}
                        formatter={(v: any, name: string) => [`${v} kg`, name === 'lean' ? 'Lean Mass' : 'Fat Mass']} />
                    <Area type="monotone" dataKey="lean" stackId="1" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
                    <Area type="monotone" dataKey="fat"  stackId="1" stroke="#ef4444" fill="#ef444420" strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── WEIGHT TREND with 7-day rolling average ─────────────────────────────────

function WeightTrendChart({ trends }: { trends: any[] }) {
    const data = trends.filter(t => t.weight != null);
    if (data.length < 2) return null;

    // Compute 7-day rolling average
    const withAvg = data.map((d, i) => {
        const window = data.slice(Math.max(0, i - 6), i + 1).map(x => x.weight).filter(Boolean);
        const avg = window.length ? Math.round((window.reduce((a, b) => a + b, 0) / window.length) * 10) / 10 : null;
        return { ...d, avg };
    });

    const latest = data[data.length - 1].weight;
    const prev = data[data.length - 2].weight;
    const diff = Math.round((latest - prev) * 10) / 10;

    // Rate of change (per week) using first and last with valid weight
    let rocPerWeek: string | null = null;
    if (data.length >= 2) {
        const days = Math.max(differenceInDays(parseISO(data[data.length - 1].date), parseISO(data[0].date)), 1);
        const totalChange = data[data.length - 1].weight - data[0].weight;
        const perWeek = Math.round((totalChange / days) * 7 * 10) / 10;
        rocPerWeek = (perWeek > 0 ? '+' : '') + perWeek + ' kg/week';
    }

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Weight</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{latest}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>kg</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: diff === 0 ? 'var(--color-text-3)' : diff > 0 ? '#ef4444' : '#00c875' }}>
                            {(diff > 0 ? '+' : '') + diff}
                        </span>
                    </div>
                </div>
                {rocPerWeek && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Trend</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-2)', marginTop: 1 }}>{rocPerWeek}</div>
                    </div>
                )}
            </div>
            <ResponsiveContainer width="100%" height={80}>
                <LineChart data={withAvg} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} tickFormatter={d => d ? d.slice(5) : ''} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-border-light)' }}
                        labelFormatter={l => String(l).replace(/-/g, '/')}
                        formatter={(v: any, name: string) => [`${v} kg`, name === 'avg' ? '7-day avg' : 'Weight']} />
                    <Line type="monotone" dataKey="weight" stroke="#0073ea40" strokeWidth={1.5} dot={{ r: 2, fill: '#0073ea', strokeWidth: 0 }} connectNulls />
                    <Line type="monotone" dataKey="avg" stroke="#0073ea" strokeWidth={2.5} dot={false} connectNulls />
                </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                <span style={{ fontSize: '0.65rem', color: '#0073ea' }}>— 7-day average</span>
                <span style={{ fontSize: '0.65rem', color: '#0073ea80' }}>— Daily</span>
            </div>
        </div>
    );
}

// ─── BLOOD PRESSURE ZONE CHART ────────────────────────────────────────────────

function BpZoneChart({ trends }: { trends: any[] }) {
    const data = trends.filter(t => t.systolic != null && t.diastolic != null);
    if (data.length < 1) return null;

    const latest = data[data.length - 1];
    const classify = (s: number, d: number) => {
        if (s < 120 && d < 80) return { label: 'Normal', color: '#00c875' };
        if (s < 130 && d < 80) return { label: 'Elevated', color: '#f59e0b' };
        if (s < 140 || d < 90) return { label: 'Stage 1', color: '#f97316' };
        return { label: 'Stage 2', color: '#ef4444' };
    };
    const { label, color } = classify(latest.systolic, latest.diastolic);

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Blood Pressure</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{latest.systolic}</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-3)' }}>/</span>
                        <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{latest.diastolic}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>mmHg</span>
                    </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color, background: `${color}20`, padding: '2px 10px', borderRadius: 20 }}>{label}</span>
            </div>
            {data.length >= 2 && (
                <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={data} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} tickFormatter={d => d ? d.slice(5) : ''} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} domain={[50, 'auto']} />
                        <ReferenceLine y={120} stroke="#00c87540" strokeDasharray="3 2" />
                        <ReferenceLine y={130} stroke="#f59e0b40" strokeDasharray="3 2" />
                        <ReferenceLine y={140} stroke="#ef444440" strokeDasharray="3 2" />
                        <Tooltip contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 8 }}
                            labelFormatter={l => String(l).replace(/-/g, '/')}
                            formatter={(v: any, name: string) => [`${v} mmHg`, name === 'systolic' ? 'Systolic' : 'Diastolic']} />
                        <Line type="monotone" dataKey="systolic"  stroke="#ef4444" strokeWidth={2} dot={{ r: 2.5, fill: '#ef4444', strokeWidth: 0 }} connectNulls />
                        <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5, fill: '#3b82f6', strokeWidth: 0 }} connectNulls />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

// ─── RHR TREND with moving average ───────────────────────────────────────────

function RhrChart({ trends }: { trends: any[] }) {
    const data = trends.filter(t => t.hr != null);
    if (data.length < 1) return null;

    const withAvg = data.map((d, i) => {
        const window = data.slice(Math.max(0, i - 6), i + 1).map(x => x.hr).filter(Boolean);
        const avg = window.length ? Math.round(window.reduce((a: number, b: number) => a + b, 0) / window.length) : null;
        return { ...d, avg };
    });

    const latest = data[data.length - 1].hr;
    const fitness = latest < 60 ? { label: 'Athlete', color: '#00c875' } : latest < 70 ? { label: 'Fit', color: '#0073ea' } : latest < 80 ? { label: 'Average', color: '#f59e0b' } : { label: 'High', color: '#ef4444' };

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Resting Heart Rate</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{latest}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>bpm</span>
                    </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: fitness.color, background: `${fitness.color}20`, padding: '2px 10px', borderRadius: 20 }}>{fitness.label}</span>
            </div>
            <ResponsiveContainer width="100%" height={72}>
                <LineChart data={withAvg} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} tickFormatter={d => d ? d.slice(5) : ''} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} domain={['auto', 'auto']} />
                    <ReferenceLine y={60} stroke="#00c87540" strokeDasharray="4 3" />
                    <Tooltip contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 8 }}
                        labelFormatter={l => String(l).replace(/-/g, '/')}
                        formatter={(v: any, name: string) => [`${v} bpm`, name === 'avg' ? '7-day avg' : 'RHR']} />
                    <Line type="monotone" dataKey="hr"  stroke="#8b5cf640" strokeWidth={1.5} dot={{ r: 2, fill: '#8b5cf6', strokeWidth: 0 }} connectNulls />
                    <Line type="monotone" dataKey="avg" stroke="#8b5cf6" strokeWidth={2.5} dot={false} connectNulls />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── MEASUREMENT DELTA CARDS ──────────────────────────────────────────────────

function MeasurementDeltas({ trends }: { trends: any[] }) {
    if (trends.length < 2) return null;

    const recent = trends.slice(-2);
    const prev = recent[0];
    const curr = recent[1];

    const fields = [
        { key: 'waist', label: 'Waist', unit: 'cm', good: 'down' },
        { key: 'hip',   label: 'Hip',   unit: 'cm', good: 'down' },
        { key: 'chest', label: 'Chest', unit: 'cm', good: 'up'   },
        { key: 'leftArm', label: 'Arm', unit: 'cm', good: 'up'   },
        { key: 'bodyFat', label: 'Body Fat', unit: '%', good: 'down' },
    ].filter(f => curr[f.key] != null && prev[f.key] != null);

    if (!fields.length) return null;

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
                Last Change
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {fields.map(f => {
                    const delta = Math.round((curr[f.key] - prev[f.key]) * 10) / 10;
                    const pct = prev[f.key] ? Math.round((delta / prev[f.key]) * 1000) / 10 : 0;
                    const isGood = (f.good === 'down' && delta <= 0) || (f.good === 'up' && delta >= 0);
                    const color = delta === 0 ? 'var(--color-text-3)' : isGood ? '#00c875' : '#ef4444';
                    return (
                        <div key={f.key} style={{ padding: '10px', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-2)', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-3)', fontWeight: 600, marginBottom: 4 }}>{f.label}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color }}>{delta > 0 ? '+' : ''}{delta}{f.unit}</div>
                            <div style={{ fontSize: '0.6rem', color, opacity: 0.8 }}>{pct > 0 ? '+' : ''}{pct}%</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── ACTIVITY HEATMAP ─────────────────────────────────────────────────────────

function ActivityHeatmap({ sessions }: { sessions: WorkoutSession[] }) {
    const today = new Date();
    const days = 84; // 12 weeks
    const cells: { date: string; count: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
        const d = format(subDays(today, i), 'yyyy-MM-dd');
        const count = sessions.filter(s => s.date === d && s.status === 'completed').length;
        cells.push({ date: d, count });
    }

    const weeks: { date: string; count: number }[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const getColor = (count: number) => {
        if (count === 0) return 'var(--color-surface-2)';
        if (count === 1) return '#bfdbfe';
        if (count === 2) return '#60a5fa';
        return '#0073ea';
    };

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
                Workout Activity — 12 Weeks
            </div>
            <div style={{ display: 'flex', gap: 3 }}>
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {week.map(cell => (
                            <div key={cell.date} title={`${cell.date}: ${cell.count} workout${cell.count !== 1 ? 's' : ''}`}
                                style={{ width: 10, height: 10, borderRadius: 2, background: getColor(cell.count), border: '1px solid var(--color-border-light)' }} />
                        ))}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-3)' }}>Less</span>
                {['var(--color-surface-2)', '#bfdbfe', '#60a5fa', '#0073ea'].map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c, border: '1px solid var(--color-border-light)' }} />
                ))}
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-3)' }}>More</span>
            </div>
        </div>
    );
}

// ─── VOLUME LOAD (Strength progression) ──────────────────────────────────────

function VolumeLoadChart({ sessions }: { sessions: WorkoutSession[] }) {
    const completed = sessions.filter(s => s.status === 'completed' && s.exerciseLogs?.length);
    if (completed.length < 2) return null;

    // Group by week and sum tonnage (sets × reps × weight)
    const weekMap: Record<string, number> = {};
    completed.forEach(s => {
        const week = format(startOfWeek(parseISO(s.date), { weekStartsOn: 1 }), 'MM/dd');
        let tonnage = 0;
        s.exerciseLogs?.forEach(log => {
            log.sets?.forEach(set => {
                if (set.weight && set.reps) tonnage += set.weight * set.reps;
            });
        });
        weekMap[week] = (weekMap[week] || 0) + tonnage;
    });

    const data = Object.entries(weekMap).sort((a, b) => a[0].localeCompare(b[0])).map(([week, vol]) => ({ week, vol: Math.round(vol) }));
    if (data.length < 2) return null;

    const latest = data[data.length - 1].vol;
    const prev = data[data.length - 2].vol;
    const diff = latest - prev;

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Volume Load</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{latest.toLocaleString()}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-3)' }}>kg this week</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: diff >= 0 ? '#00c875' : '#ef4444' }}>
                            {diff >= 0 ? '+' : ''}{diff.toLocaleString()}
                        </span>
                    </div>
                </div>
                <Activity size={16} color="var(--color-text-3)" />
            </div>
            <ResponsiveContainer width="100%" height={72}>
                <LineChart data={data} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-3)' }} />
                    <Tooltip contentStyle={{ fontSize: 11, padding: '4px 8px', borderRadius: 8 }}
                        formatter={(v: any) => [`${Number(v).toLocaleString()} kg`, 'Volume']} />
                    <Line type="monotone" dataKey="vol" stroke="#00c875" strokeWidth={2.5} dot={{ r: 3, fill: '#00c875', strokeWidth: 0 }} connectNulls />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

// ─── LOCKED CARDS (unlock prompts) ───────────────────────────────────────────

function LockedCards({ latest, trends, sessions, onNavigate }: {
    latest: any; trends: any[]; sessions: WorkoutSession[];
    onNavigate: (v: ViewMode) => void;
}) {
    const locked: { icon: string; label: string; hint: string; nav: ViewMode }[] = [];

    if (!latest?.waist || !latest?.hip)
        locked.push({ icon: '📐', label: 'Waist-to-Hip Ratio', hint: 'Log waist + hip measurements', nav: 'measurements' });

    if (!trends.some(t => t.bodyFat != null))
        locked.push({ icon: '⚖️', label: 'Body Composition', hint: 'Log body fat % in measurements', nav: 'measurements' });

    if (!trends.some(t => t.systolic != null))
        locked.push({ icon: '🩺', label: 'Blood Pressure', hint: 'Log systolic + diastolic BP', nav: 'measurements' });

    if (!trends.some(t => t.hr != null))
        locked.push({ icon: '💓', label: 'Resting Heart Rate', hint: 'Log resting heart rate', nav: 'measurements' });

    if (!sessions.some(s => s.status === 'completed'))
        locked.push({ icon: '🏋️', label: 'Activity Heatmap', hint: 'Complete a workout session', nav: 'workouts' });

    if (locked.length === 0) return null;

    return (
        <div className="card" style={{ marginBottom: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                Unlock More Analytics
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {locked.map(item => (
                    <button key={item.label} onClick={() => onNavigate(item.nav)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-2)', border: '1px dashed var(--color-border)', cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'left', width: '100%' }}>
                        <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-2)' }}>{item.label}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-3)' }}>{item.hint}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700 }}>+ Add →</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

export default function Dashboard({ data, loading, onRefresh, onNavigate }: Props) {
    const today = format(new Date(), 'EEEE, MMMM d');
    const [trends, setTrends] = useState<any[]>([]);
    const [allSessions, setAllSessions] = useState<WorkoutSession[]>([]);

    useEffect(() => {
        api.measurements.trends().then((t: HealthMeasurement[]) => {
            setTrends(t.map(m => ({
                date: m.date,
                weight: m.weight ?? null,
                waist: m.waist ?? null,
                hip: m.hip ?? null,
                chest: m.chest ?? null,
                leftArm: m.leftArm ?? null,
                bodyFat: m.bodyFatPercentage ?? null,
                systolic: m.systolicBp ?? null,
                diastolic: m.diastolicBp ?? null,
                hr: m.restingHeartRate ?? null,
            })));
        }).catch(() => {});

        api.workouts.sessions.list().then(setAllSessions).catch(() => {});
    }, []);

    if (loading && !data) {
        return (
            <div className="page">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                    {[1,2,3,4].map(i => (
                        <div key={i} style={{ height: 100, borderRadius: 'var(--radius-2xl)', background: 'var(--color-border-light)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                    ))}
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
            </div>
        );
    }

    const habits = data?.habits;
    const measurement = data?.measurement;
    // Prefer the freshly-fetched trends data for the latest measurement values
    const latestFromTrends = trends.length > 0 ? trends[trends.length - 1] : null;
    const latestRaw = measurement?.latest;
    const latest = latestRaw ? {
        ...latestRaw,
        waist: latestRaw.waist ?? latestFromTrends?.waist ?? null,
        hip: latestRaw.hip ?? latestFromTrends?.hip ?? null,
        bodyFatPercentage: latestRaw.bodyFatPercentage ?? latestFromTrends?.bodyFat ?? null,
        systolicBp: latestRaw.systolicBp ?? latestFromTrends?.systolic ?? null,
        diastolicBp: latestRaw.diastolicBp ?? latestFromTrends?.diastolic ?? null,
        restingHeartRate: latestRaw.restingHeartRate ?? latestFromTrends?.hr ?? null,
    } : null;

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

    const hasData = trends.length >= 1 || latest;

    return (
        <div className="page">
            {/* Header */}
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
            <div className="card" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)', color: '#fff', marginBottom: 16, padding: '16px 20px', border: 'none', boxShadow: '0 4px 16px rgba(0,115,234,.25)' }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.5 }}>{motivationalMsg}</p>
            </div>

            {/* Quick actions */}
            <div style={{ marginBottom: 20 }}>
                <div className="section-title">Quick Actions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                        { icon: Dumbbell,       label: 'Workout', view: 'workouts'     as ViewMode, color: '#3b82f6' },
                        { icon: UtensilsCrossed, label: 'Meal',    view: 'meals'        as ViewMode, color: '#f59e0b' },
                        { icon: Timer,           label: 'Fast',    view: 'meals'        as ViewMode, color: '#8b5cf6' },
                        { icon: Ruler,           label: 'Measure', view: 'measurements' as ViewMode, color: '#06b6d4' },
                    ].map(a => (
                        <button key={a.label} onClick={() => onNavigate(a.view)}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px', borderRadius: 'var(--radius-xl)', background: 'var(--color-surface)', border: '1.5px solid var(--color-border-light)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-2)', transition: 'all .15s' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-lg)', background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <a.icon size={18} color={a.color} strokeWidth={2} />
                            </div>
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Habits */}
            {habits && habits.total > 0 && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Flame size={18} color="var(--color-primary)" />
                            <span style={{ fontWeight: 700 }}>Today's Habits</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ProgressRing value={habits.completed} max={habits.total} size={44} stroke={4} />
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>{habits.completed}/{habits.total}</span>
                        </div>
                    </div>
                    {habits.list.slice(0, 4).map(h => (
                        <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${h.completion?.completed ? 'var(--color-primary)' : 'var(--color-border)'}`, background: h.completion?.completed ? 'var(--color-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {h.completion?.completed && <CheckCircle2 size={14} color="#fff" strokeWidth={3} />}
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: h.completion?.completed ? 'var(--color-text-3)' : 'var(--color-text)', textDecoration: h.completion?.completed ? 'line-through' : 'none', flex: 1 }}>{h.name}</span>
                        </div>
                    ))}
                    {habits.total > 4 && (
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('habits')}>
                            +{habits.total - 4} more
                        </button>
                    )}
                </div>
            )}

            {/* Calendar */}
            <div style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Calendar</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')} style={{ fontSize: '0.75rem' }}>View all</button>
                </div>
                <CalendarMini onNavigate={() => onNavigate('calendar')} />
            </div>

            {/* Health Analytics */}
            <div style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Health Analytics</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('measurements')} style={{ fontSize: '0.75rem' }}>All data</button>
                </div>

                {!hasData ? (
                    <div className="card" style={{ padding: '24px 20px', textAlign: 'center' }}>
                        <Ruler size={28} color="var(--color-border)" style={{ margin: '0 auto 10px' }} />
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-3)', marginBottom: 12 }}>Log body measurements to see your health analytics here.</p>
                        <button className="btn btn-primary btn-sm" style={{ margin: '0 auto' }} onClick={() => onNavigate('measurements')}>Add measurement</button>
                    </div>
                ) : (
                    <>
                        {/* BMI */}
                        {latest?.bmi && <BmiGauge bmi={latest.bmi} weight={latest.weight} />}

                        {/* WHR */}
                        {latest?.waist && latest?.hip && <WHRCard waist={latest.waist} hip={latest.hip} />}

                        {/* Body composition stacked area */}
                        <BodyCompositionChart trends={trends} />

                        {/* Weight trend + 7-day avg + RoC */}
                        <WeightTrendChart trends={trends} />

                        {/* Measurement deltas */}
                        <MeasurementDeltas trends={trends} />

                        {/* Blood pressure zone chart */}
                        <BpZoneChart trends={trends} />

                        {/* RHR with moving avg */}
                        <RhrChart trends={trends} />

                        {/* Activity heatmap */}
                        <ActivityHeatmap sessions={allSessions} />

                        {/* Volume load progression */}
                        <VolumeLoadChart sessions={allSessions} />

                        {/* Locked cards — show what data to log to unlock */}
                        <LockedCards latest={latest} trends={trends} sessions={allSessions} onNavigate={onNavigate} />
                    </>
                )}
            </div>

            <div style={{ height: 8 }} />
        </div>
    );
}
