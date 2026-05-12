import { BarChart3, Percent } from 'lucide-react';
import type { ValueMode } from '../types';

type MetricToggleProps = {
  valueMode: ValueMode;
  onChange: (mode: ValueMode) => void;
};

const options: Array<{
  mode: ValueMode;
  label: string;
  icon: typeof BarChart3;
}> = [
  { mode: 'absolute', label: 'Dollars', icon: BarChart3 },
  { mode: 'percentage', label: 'Percent', icon: Percent },
];

export function MetricToggle({ valueMode, onChange }: MetricToggleProps) {
  return (
    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = valueMode === mode;

        return (
          <button
            key={mode}
            className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
              isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
            type="button"
            onClick={() => onChange(mode)}
            title={`View revenue as ${label.toLowerCase()}`}
          >
            <Icon size={16} strokeWidth={2.2} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
