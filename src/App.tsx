import { useMemo, useState } from 'react';
import { Building2, Database, Layers3, WalletCards } from 'lucide-react';
import { CompanySelector } from './components/CompanySelector';
import { EarningsFlow } from './components/EarningsFlow';
import { MetricToggle } from './components/MetricToggle';
import { QuarterSelector } from './components/QuarterSelector';
import { SegmentDetails } from './components/SegmentDetails';
import { earningsData, quarterReportingPeriodIds, quarters } from './data/earningsData';
import { secReportSources } from './data/secReportSources';
import { formatRevenue } from './utils/format';
import type { ValueMode } from './types';

function App() {
  const [selectedCompanyId, setSelectedCompanyId] = useState(earningsData[0].id);
  const [selectedQuarter, setSelectedQuarter] = useState<(typeof quarters)[number]>(quarters[0]);
  const [selectedSegmentName, setSelectedSegmentName] = useState(
    earningsData[0].quarters[quarters[0]].segments[0].name,
  );
  const [valueMode, setValueMode] = useState<ValueMode>('absolute');

  const selectedCompany = useMemo(
    () => earningsData.find((company) => company.id === selectedCompanyId) ?? earningsData[0],
    [selectedCompanyId],
  );

  const quarterData = selectedCompany.quarters[selectedQuarter];
  const selectedSegment =
    quarterData.segments.find((segment) => segment.name === selectedSegmentName) ??
    quarterData.segments[0];
  const reportingPeriodId = quarterReportingPeriodIds[selectedQuarter];
  const sourceReport = reportingPeriodId
    ? secReportSources.find(
        (report) =>
          report.company_id === selectedCompany.id &&
          report.reporting_period_id === reportingPeriodId,
      )
    : undefined;
  const { financials } = quarterData;

  const handleCompanyChange = (companyId: string) => {
    const nextCompany = earningsData.find((company) => company.id === companyId) ?? earningsData[0];
    setSelectedCompanyId(nextCompany.id);
    setSelectedSegmentName(nextCompany.quarters[selectedQuarter].segments[0].name);
  };

  const handleQuarterChange = (quarter: string) => {
    const nextQuarter = quarter as (typeof quarters)[number];
    setSelectedQuarter(nextQuarter);
    setSelectedSegmentName(selectedCompany.quarters[nextQuarter].segments[0].name);
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
      <div className="mx-auto flex w-full max-w-[1840px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-[8px] border border-slate-200 bg-white shadow-card">
          <div
            className="h-1 rounded-t-[8px]"
            style={{ backgroundColor: selectedCompany.accentColor }}
          />
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-[8px] text-white shadow-sm"
                style={{ backgroundColor: selectedCompany.accentColor }}
              >
                <WalletCards size={22} />
              </span>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-400">Earnie</p>
                <h1 className="text-2xl font-bold tracking-normal text-slate-950 md:text-3xl">
                  {selectedCompany.name} revenue flow
                </h1>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(230px,1fr)_minmax(170px,1fr)_auto]">
              <CompanySelector
                companies={earningsData}
                selectedCompanyId={selectedCompanyId}
                onChange={handleCompanyChange}
              />
              <QuarterSelector
                quarters={quarters}
                selectedQuarter={selectedQuarter}
                onChange={handleQuarterChange}
              />
              <div className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                View
                <MetricToggle valueMode={valueMode} onChange={setValueMode} />
              </div>
            </div>
          </div>

          <div className="grid border-t border-slate-100 bg-slate-50/80 md:grid-cols-4">
            {[
              {
                label: 'Revenue',
                value: formatRevenue(quarterData.totalRevenue),
                icon: WalletCards,
              },
              {
                label: 'Gross profit',
                value: formatRevenue(financials.grossProfit),
                icon: Layers3,
              },
              {
                label: 'Earnings',
                value: formatRevenue(financials.earnings),
                icon: Building2,
              },
              {
                label: 'Expenses',
                value: formatRevenue(financials.expenses),
                icon: Database,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex min-h-24 items-center gap-4 border-slate-100 px-5 py-4 md:border-r"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 line-clamp-2 text-base font-bold leading-snug text-slate-950">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <EarningsFlow
            company={selectedCompany}
            quarterData={quarterData}
            selectedSegmentName={selectedSegment.name}
            valueMode={valueMode}
            onSelectSegment={setSelectedSegmentName}
          />
          <SegmentDetails
            company={selectedCompany}
            quarter={selectedQuarter}
            quarterData={quarterData}
            selectedSegment={selectedSegment}
            sourceReport={sourceReport}
          />
        </div>

        <footer className="rounded-[8px] border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-500 shadow-card">
          Data Source: SEC EDGAR XBRL calendar-quarter revenue totals. Segment allocations and
          expense bridge values are v1 structured estimates pending parsed disclosures.
        </footer>
      </div>
    </main>
  );
}

export default App;
