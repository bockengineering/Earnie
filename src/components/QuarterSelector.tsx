type QuarterSelectorProps = {
  quarters: readonly string[];
  selectedQuarter: string;
  onChange: (quarter: string) => void;
};

export function QuarterSelector({
  quarters,
  selectedQuarter,
  onChange,
}: QuarterSelectorProps) {
  return (
    <label className="flex min-w-40 flex-col gap-2 text-sm font-medium text-slate-600">
      Quarter
      <select
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
        value={selectedQuarter}
        onChange={(event) => onChange(event.target.value)}
      >
        {quarters.map((quarter) => (
          <option key={quarter} value={quarter}>
            {quarter}
          </option>
        ))}
      </select>
    </label>
  );
}
