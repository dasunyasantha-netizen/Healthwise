import { LayoutDashboard, Dumbbell, UtensilsCrossed, Flame, Ruler, CalendarDays } from 'lucide-react';
import { ViewMode } from '../types';

const TABS: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard',    label: 'Home',      icon: LayoutDashboard },
    { id: 'workouts',     label: 'Workouts',  icon: Dumbbell },
    { id: 'meals',        label: 'Meals',     icon: UtensilsCrossed },
    { id: 'habits',       label: 'Streaks',   icon: Flame },
    { id: 'measurements', label: 'Body',      icon: Ruler },
    { id: 'calendar',     label: 'Calendar',  icon: CalendarDays },
];

interface Props {
    current: ViewMode;
    onChange: (v: ViewMode) => void;
}

export default function BottomNav({ current, onChange }: Props) {
    return (
        <nav className="bottom-nav">
            {TABS.map(tab => {
                const Icon = tab.icon;
                const active = current === tab.id;
                return (
                    <button
                        key={tab.id}
                        className={`bottom-nav-item${active ? ' active' : ''}`}
                        onClick={() => onChange(tab.id)}
                    >
                        <span className="nav-icon-wrap">
                            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                        </span>
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}
