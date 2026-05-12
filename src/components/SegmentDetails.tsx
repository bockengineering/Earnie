import { ArrowUpRight, Building2, Layers3 } from 'lucide-react';
import type { Company, QuarterData, Segment } from '../data/earningsData';
import { formatPercent, formatRevenue } from '../utils/format';

type SegmentDetailsProps = {
  company: Company;
  quarter: string;
  quarterData: QuarterData;
  selectedSegment: Segment;
};

export function SegmentDetails({
  company,
  quarter,
  quarterData,
  selectedSegment,
}: SegmentDetailsProps) {
  const largestSegment = [...quarterData.segments].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <aside className="flex h-full flex-col gap-5 rounded-[8px] border border-slate-200 bg-white p-5 shadow-card">
      <div>
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-[8px] text-white shadow-sm"
            style={{ backgroundColor: company.accentColor }}
          >
            <Building2 size={21} />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-500">{quarter}</p>
            <h2 className="text-xl font-bold text-slate-950">
              {company.name} <span className="text-slate-400">{company.ticker}</span>
            </h2>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[8px] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total revenue
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              {formatRevenue(quarterData.totalRevenue)}
            </p>
          </div>
          <div className="rounded-[8px] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Segments
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              {quarterData.segments.length}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-[8px] bg-slate-950 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Largest segment
          </p>
          <p className="mt-1 text-lg font-bold">{largestSegment.name}</p>
          <p className="text-sm text-slate-300">
            {formatRevenue(largestSegment.revenue)} ·{' '}
            {formatPercent(largestSegment.revenue, quarterData.totalRevenue)}
          </p>
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      <section>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Selected segment</p>
            <h3 className="mt-1 text-2xl font-bold leading-tight text-slate-950">
              {selectedSegment.name}
            </h3>
          </div>
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-[8px] text-white"
            style={{ backgroundColor: selectedSegment.color }}
          >
            <Layers3 size={19} />
          </span>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <p className="text-4xl font-bold text-slate-950">
            {formatRevenue(selectedSegment.revenue)}
          </p>
          <p className="pb-1 text-sm font-semibold text-slate-500">
            {formatPercent(selectedSegment.revenue, quarterData.totalRevenue)} of company revenue
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">Breakdown</h4>
          <ArrowUpRight className="text-slate-400" size={17} />
        </div>

        {selectedSegment.children.map((child) => {
          const percentOfSegment = selectedSegment.revenue
            ? (child.revenue / selectedSegment.revenue) * 100
            : 0;

          return (
            <div key={child.name} className="rounded-[8px] border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-700">{child.name}</p>
                <p className="text-sm font-bold text-slate-950">{formatRevenue(child.revenue)}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percentOfSegment}%`,
                    backgroundColor: selectedSegment.color,
                  }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">
                {percentOfSegment.toFixed(1)}% of selected segment
              </p>
            </div>
          );
        })}
      </section>
    </aside>
  );
}
