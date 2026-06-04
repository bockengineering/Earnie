import { Building2, ExternalLink, FileText, Layers3 } from 'lucide-react';
import type { Company, QuarterData, Segment } from '../data/earningsData';
import { formatPercent, formatRevenue } from '../utils/format';
import type { secReportSources } from '../data/secReportSources';

type SegmentDetailsProps = {
  company: Company;
  quarter: string;
  quarterData: QuarterData;
  selectedSegment: Segment;
  sourceReport?: (typeof secReportSources)[number];
};

export function SegmentDetails({
  company,
  quarter,
  quarterData,
  selectedSegment,
  sourceReport,
}: SegmentDetailsProps) {
  const { financials } = quarterData;
  const largestSegment = [...quarterData.segments].sort((a, b) => b.revenue - a.revenue)[0];
  const selectedPercent = formatPercent(selectedSegment.revenue, quarterData.totalRevenue);
  const sourceDerivation =
    sourceReport?.revenue_derivation === 'annual_cy_minus_prior_ytd_same_fiscal_year'
      ? 'Derived from annual less YTD'
      : 'Direct CY XBRL fact';

  return (
    <aside className="flex h-full flex-col gap-4 rounded-[8px] border border-slate-200 bg-white p-5 shadow-card">
      <section>
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 items-center justify-center rounded-[8px] text-white shadow-sm"
            style={{ backgroundColor: company.accentColor }}
          >
            <Building2 size={19} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{quarter}</p>
            <h2 className="text-lg font-bold text-slate-950">
              {company.name} <span className="text-slate-400">{company.ticker}</span>
            </h2>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ['Total revenue', formatRevenue(quarterData.totalRevenue)],
            ['Gross profit', formatRevenue(financials.grossProfit)],
            ['Earnings', formatRevenue(financials.earnings)],
            ['Expenses', formatRevenue(financials.expenses)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[8px] border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-[8px] border border-slate-200 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Largest segment
          </p>
          <p className="mt-1 text-base font-bold text-slate-950">{largestSegment.name}</p>
          <p className="text-sm font-semibold text-slate-500">
            {formatRevenue(largestSegment.revenue)} ·{' '}
            {formatPercent(largestSegment.revenue, quarterData.totalRevenue)}
          </p>
        </div>
      </section>

      <div className="h-px bg-slate-100" />

      <section className="rounded-[8px] border border-slate-200 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Selected segment
            </p>
            <h3 className="mt-1 text-xl font-bold leading-tight text-slate-950">
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

        <div className="mt-4">
          <p className="text-3xl font-bold leading-none text-slate-950">
            {formatRevenue(selectedSegment.revenue)}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {selectedPercent} of company revenue
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: selectedPercent,
                backgroundColor: selectedSegment.color,
              }}
            />
          </div>
        </div>
      </section>

      {sourceReport ? (
        <section className="rounded-[8px] border border-slate-100 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
              <FileText size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Source filing
              </p>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-950">
                    {sourceReport.form_type} · period ended {sourceReport.period_end_date}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Filed {sourceReport.filing_date} · {sourceDerivation}
                  </p>
                </div>
                <a
                  className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-950 hover:ring-slate-300"
                  href={sourceReport.primary_document_url}
                  rel="noreferrer"
                  target="_blank"
                  title="Open SEC filing"
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Expense bridge
          </h4>
          <span className="text-xs font-bold text-slate-400">
            {financials.expenseLines.length} lines
          </span>
        </div>

        {financials.expenseLines.map((line) => {
          const percentOfExpenses = financials.expenses
            ? (line.amount / financials.expenses) * 100
            : 0;

          return (
            <div
              key={line.name}
              className="rounded-[8px] border border-slate-100 bg-white p-3 transition hover:border-slate-200 hover:shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-700">{line.name}</p>
                <p className="text-sm font-bold text-slate-950">{formatRevenue(line.amount)}</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${percentOfExpenses}%`,
                    backgroundColor: line.color,
                  }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">
                {formatPercent(line.amount, quarterData.totalRevenue)} of company revenue
              </p>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Selected segment lines
          </h4>
          <span className="text-xs font-bold text-slate-400">
            {selectedSegment.children.length} lines
          </span>
        </div>

        {selectedSegment.children.map((child) => {
          const percentOfSegment = selectedSegment.revenue
            ? (child.revenue / selectedSegment.revenue) * 100
            : 0;

          return (
            <div
              key={child.name}
              className="rounded-[8px] border border-slate-100 bg-white p-3 transition hover:border-slate-200 hover:shadow-sm"
            >
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
