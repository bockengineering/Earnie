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
  const stateClass = isSelected
    ? 'border-slate-900 shadow-soft ring-4 ring-slate-100'
    : 'border-slate-200';
  const interactionClass = isInteractive
    ? 'cursor-pointer hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft'
    : 'cursor-default';
  const className = `group absolute overflow-hidden rounded-[8px] border bg-white p-4 text-left shadow-card outline-none transition duration-200 focus-visible:ring-4 focus-visible:ring-slate-100 ${stateClass} ${interactionClass}`;
  const style = {
    left: x,
    top: y,
    width,
    height,
  };
  const content = (
    <>
      <span
        className="absolute inset-y-0 left-0 block w-1.5"
        style={{ backgroundColor: color }}
      />
      <span className="flex h-full flex-col justify-between pl-2">
        <span>
          <span className="block text-[12px] font-bold uppercase tracking-wide text-slate-400">
            {secondaryValue}
          </span>
          <span className="mt-1 block text-2xl font-bold leading-none text-slate-950">
            {primaryValue}
          </span>
        </span>
        <span className="block text-sm font-bold leading-snug text-slate-700 [overflow-wrap:anywhere]">
          {name}
        </span>
      </span>
    </>
  );

  if (!isInteractive) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      aria-pressed={isSelected}
      className={className}
      style={style}
      type="button"
      onClick={onClick}
    >
      {content}
    </button>
  );
}
