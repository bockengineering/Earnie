import type { Company } from '../data/earningsData';

type CompanySelectorProps = {
  companies: Company[];
  selectedCompanyId: string;
  onChange: (companyId: string) => void;
};

export function CompanySelector({
  companies,
  selectedCompanyId,
  onChange,
}: CompanySelectorProps) {
  return (
    <label className="flex min-w-52 flex-col gap-2 text-sm font-medium text-slate-600">
      Company
      <select
        className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200"
        value={selectedCompanyId}
        onChange={(event) => onChange(event.target.value)}
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name} ({company.ticker})
          </option>
        ))}
      </select>
    </label>
  );
}
