import { formatPercent, formatRevenue } from '../utils/format';
import type { ValueMode } from '../types';

type FlowNodeProps = {
  name: string;
  revenue: number;
  totalRevenue: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height?: number;
  isSelected?: boolean;
  isInteractive?: boolean;
  valueMode: ValueMode;
  onClick?: () => void;
};

export function FlowNode({
  name,
  revenue,
  totalRevenue,
  color,
  x,
  y,
  width,
  height,
  isSelected = false,
  isInteractive = false,
  valueMode,
  onClick,
}: FlowNodeProps) {
  const percent = formatPercent(revenue, totalRevenue);
  const dollars = formatRevenue(revenue);
  const primaryValue = valueMode === 'absolute' ? dollars : percent;
  const secondaryValue = valueMode === 'absolute' ? percent : dollars;

  return (
    <button
      className={`group absolute overflow-hidden rounded-[8px] border bg-white p-4 text-left shadow-card outline-none transition duration-200 ${
        isSelected
          ? 'border-slate-900 shadow-soft ring-4 ring-slate-200'
          : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft'
      } ${isInteractive ? 'cursor-pointer' : 'cursor-default'}`}
      style={{
        left: x,
        top: y,
        width,
        height,
      }}
      type="button"
      onClick={onClick}
      disabled={!isInteractive}
    >
      <span className="mb-3 block h-1.5 w-12 rounded-full" style={{ backgroundColor: color }} />
      <span className="block text-[13px] font-semibold uppercase tracking-wide text-slate-400">
        {secondaryValue}
      </span>
      <span className="mt-1 block text-xl font-bold leading-tight text-slate-950">
        {primaryValue}
      </span>
      <span className="mt-2 block text-sm font-semibold leading-snug text-slate-700">{name}</span>
    </button>
  );
}
