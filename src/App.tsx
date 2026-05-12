import { useMemo, useState } from 'react';
import { ChevronRight, WalletCards } from 'lucide-react';
import { CompanySelector } from './components/CompanySelector';
import { EarningsFlow } from './components/EarningsFlow';
import { MetricToggle } from './components/MetricToggle';
import { QuarterSelector } from './components/QuarterSelector';
import { SegmentDetails } from './components/SegmentDetails';
import { earningsData, quarters } from './data/earningsData';
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
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-5 py-6 lg:px-8">
        <header className="overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-soft">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-[8px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
                <WalletCards size={17} />
                Earnie
              </div>
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 md:text-5xl">
                Earnings flows for public tech companies
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
                Explore how quarterly revenue moves from the company total into segments and
                segment-level revenue lines.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(160px,1fr)_auto]">
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

          <div className="grid border-t border-slate-100 bg-slate-50/70 md:grid-cols-3">
            {[
              ['Company', `${selectedCompany.name} (${selectedCompany.ticker})`],
              ['Quarter revenue', formatRevenue(quarterData.totalRevenue)],
              ['Selected segment', selectedSegment.name],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-slate-100 px-6 py-4 md:border-r">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
                </div>
                <ChevronRight className="text-slate-300" size={19} />
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
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
          />
        </div>

        <footer className="rounded-[8px] border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-500 shadow-card">
          Data Source: Mock financial data, replace with SEC/company filings.
        </footer>
      </div>
    </main>
  );
}

export default App;
