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
    <label className="flex min-w-40 flex-col gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      Period
      <select
        className="h-10 rounded-[8px] border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
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
