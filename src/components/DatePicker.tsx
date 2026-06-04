import { useState, useEffect, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface DatePickerProps {
    value: string;           // yyyy-MM-dd
    onChange: (v: string) => void;
    placeholder?: string;
    iconOnly?: boolean;      // show just a calendar icon button (for compact contexts)
    iconStyle?: React.CSSProperties;
}

export function DatePicker({ value, onChange, placeholder = 'Select date', iconOnly, iconStyle }: DatePickerProps) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState<Date>(() => value ? parseISO(value) : new Date());
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) setViewDate(parseISO(value));
    }, [value]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = value ? parseISO(value) : null;
    const today = new Date();

    const buildGrid = () => {
        const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
        const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
        const days: Date[] = [];
        let cur = start;
        while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
        return days;
    };

    const days = buildGrid();
    const displayValue = selected ? format(selected, 'MMM d, yyyy') : '';

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Trigger button */}
            {iconOnly ? (
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    title="Pick a date"
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '4px 8px', borderRadius: 20, cursor: 'pointer',
                        border: `1.5px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: open ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                        transition: 'all .15s',
                        ...iconStyle,
                    }}
                >
                    <CalendarDays size={14} color={open ? 'var(--color-primary)' : 'var(--color-text-2)'} />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px', borderRadius: 'var(--radius-lg)',
                        border: `1.5px solid ${open ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: 'var(--color-surface)', cursor: 'pointer',
                        fontFamily: 'var(--font)', fontSize: '0.9375rem',
                        color: displayValue ? 'var(--color-text)' : 'var(--color-text-3)',
                        transition: 'border-color .15s',
                    }}
                >
                    <CalendarDays size={16} color={open ? 'var(--color-primary)' : 'var(--color-text-3)'} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, textAlign: 'left' }}>{displayValue || placeholder}</span>
                    <ChevronLeft size={14} color="var(--color-text-3)" style={{ transform: open ? 'rotate(90deg)' : 'rotate(-90deg)', transition: 'transform .2s' }} />
                </button>
            )}

            {/* Dropdown calendar */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 6px)',
                    ...(iconOnly ? { right: 0, left: 'auto', width: 280 } : { left: 0, right: 0 }),
                    zIndex: 300,
                    background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)',
                    border: '1.5px solid var(--color-border)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    padding: '16px',
                    animation: 'scaleIn .15s ease',
                }}>
                    {/* Month nav */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                        <button type="button" onClick={() => setViewDate(d => subMonths(d, 1))}
                            style={{ background: 'var(--color-surface-2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronLeft size={15} color="var(--color-text-2)" />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
                            {format(viewDate, 'MMMM yyyy')}
                        </span>
                        <button type="button" onClick={() => setViewDate(d => addMonths(d, 1))}
                            style={{ background: 'var(--color-surface-2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronRight size={15} color="var(--color-text-2)" />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
                        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.04em', padding: '2px 0' }}>
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                        {days.map((day, i) => {
                            const isSelected = selected ? isSameDay(day, selected) : false;
                            const isToday = isSameDay(day, today);
                            const inMonth = isSameMonth(day, viewDate);
                            const ds = format(day, 'yyyy-MM-dd');

                            let bg = 'transparent';
                            let color = inMonth ? 'var(--color-text)' : 'var(--color-text-3)';
                            let fontWeight = 400;
                            let border = 'none';

                            if (isSelected) {
                                bg = 'var(--color-primary)'; color = '#fff'; fontWeight = 700;
                            } else if (isToday) {
                                bg = 'var(--color-primary-bg)'; color = 'var(--color-primary)'; fontWeight = 700;
                                border = '1.5px solid var(--color-primary)';
                            }

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => { onChange(ds); setOpen(false); }}
                                    style={{
                                        aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: 8, border, background: bg, color,
                                        fontFamily: 'var(--font)', fontSize: '0.8125rem', fontWeight,
                                        cursor: 'pointer', transition: 'background .1s',
                                        opacity: inMonth ? 1 : 0.35,
                                    }}
                                    onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)'; }}
                                    onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = isToday ? 'var(--color-primary-bg)' : 'transparent'; }}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border-light)' }}>
                        <button type="button" onClick={() => { onChange(''); setOpen(false); }}
                            style={{ fontFamily: 'var(--font)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Clear
                        </button>
                        <button type="button" onClick={() => { onChange(format(today, 'yyyy-MM-dd')); setOpen(false); }}
                            style={{ fontFamily: 'var(--font)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
