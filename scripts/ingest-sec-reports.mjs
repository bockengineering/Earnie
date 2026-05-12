import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';

const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT ?? 'Earnie financial report ingestion contact@example.com';

const calendarYear = 2025;
const quarterIds = ['q1_2025', 'q2_2025', 'q3_2025', 'q4_2025'];
const frameByQuarter = {
  q1_2025: 'CY2025Q1',
  q2_2025: 'CY2025Q2',
  q3_2025: 'CY2025Q3',
  q4_2025: 'CY2025Q4',
};

const companies = [
  { id: 'apple', name: 'Apple', ticker: 'AAPL', cik: '0000320193', accentColor: '#111827' },
  { id: 'microsoft', name: 'Microsoft', ticker: 'MSFT', cik: '0000789019', accentColor: '#2563eb' },
  { id: 'alphabet', name: 'Alphabet', ticker: 'GOOGL', cik: '0001652044', accentColor: '#4285f4' },
  { id: 'amazon', name: 'Amazon', ticker: 'AMZN', cik: '0001018724', accentColor: '#ff9900' },
  { id: 'meta', name: 'Meta', ticker: 'META', cik: '0001326801', accentColor: '#2563eb' },
  { id: 'nvidia', name: 'Nvidia', ticker: 'NVDA', cik: '0001045810', accentColor: '#76b900' },
  { id: 'tesla', name: 'Tesla', ticker: 'TSLA', cik: '0001318605', accentColor: '#ef4444' },
  { id: 'netflix', name: 'Netflix', ticker: 'NFLX', cik: '0001065280', accentColor: '#e50914' },
  { id: 'adobe', name: 'Adobe', ticker: 'ADBE', cik: '0000796343', accentColor: '#ef4444' },
  { id: 'salesforce', name: 'Salesforce', ticker: 'CRM', cik: '0001108524', accentColor: '#0ea5e9' },
];

const reportingPeriods = [
  {
    id: 'q1_2025',
    label: 'Q1 CY 2025',
    calendar_year: 2025,
    quarter_number: 1,
    starts_on: '2025-01-01',
    ends_on: '2025-03-31',
  },
  {
    id: 'q2_2025',
    label: 'Q2 CY 2025',
    calendar_year: 2025,
    quarter_number: 2,
    starts_on: '2025-04-01',
    ends_on: '2025-06-30',
  },
  {
    id: 'q3_2025',
    label: 'Q3 CY 2025',
    calendar_year: 2025,
    quarter_number: 3,
    starts_on: '2025-07-01',
    ends_on: '2025-09-30',
  },
  {
    id: 'q4_2025',
    label: 'Q4 CY 2025',
    calendar_year: 2025,
    quarter_number: 4,
    starts_on: '2025-10-01',
    ends_on: '2025-12-31',
  },
];

const periodByQuarter = Object.fromEntries(
  reportingPeriods.map((period) => [period.id, period]),
);

const revenueConcepts = [
  'RevenueFromContractWithCustomerExcludingAssessedTax',
  'Revenues',
  'SalesRevenueNet',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const roundBillions = (value) => Math.round((value / 1_000_000_000) * 1000) / 1000;

const daysBetween = (start, end) =>
  Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86_400_000);

const daysAfter = (date, laterDate) =>
  Math.round(
    (new Date(`${laterDate}T00:00:00Z`) - new Date(`${date}T00:00:00Z`)) / 86_400_000,
  );

const secArchiveUrl = (cik, accessionNumber, primaryDocument) => {
  const cikNumber = String(Number(cik));
  const accessionPath = accessionNumber.replaceAll('-', '');
  return `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accessionPath}/${primaryDocument}`;
};

const secFilingDetailUrl = (cik, accessionNumber) => {
  const cikNumber = String(Number(cik));
  const accessionPath = accessionNumber.replaceAll('-', '');
  return `https://www.sec.gov/Archives/edgar/data/${cikNumber}/${accessionPath}/`;
};

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': SEC_USER_AGENT,
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
  });

  if (!response.ok) {
    throw new Error(`SEC request failed for ${url}: ${response.status}`);
  }

  return response.json();
}

async function fetchCompanyPayload(company) {
  const submissions = await fetchJson(`https://data.sec.gov/submissions/CIK${company.cik}.json`);
  await sleep(120);
  const companyFacts = await fetchJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik}.json`);
  await sleep(120);
  return { submissions, companyFacts };
}

function getFilingByAccession(submissions, accessionNumber) {
  const recent = submissions.filings.recent;
  const index = recent.accessionNumber.findIndex((accession) => accession === accessionNumber);

  if (index === -1) {
    throw new Error(`Could not find filing metadata for ${accessionNumber}`);
  }

  return {
    form_type: recent.form[index],
    filing_date: recent.filingDate[index],
    period_end_date: recent.reportDate[index],
    primary_document: recent.primaryDocument[index],
    metadata: {
      sec_file_number: recent.fileNumber[index],
      sec_film_number: recent.filmNumber[index],
      fiscal_year: recent.items?.[index],
    },
  };
}

function getRevenueFacts(companyFacts) {
  const candidates = [];

  for (const concept of revenueConcepts) {
    const units = companyFacts.facts?.['us-gaap']?.[concept]?.units?.USD;
    if (!units?.length) {
      continue;
    }

    const calendarFactCount = units.filter(
      (fact) =>
        ['10-Q', '10-K'].includes(fact.form) &&
        (fact.frame?.startsWith(`CY${calendarYear}`) || fact.end?.startsWith(`${calendarYear}`)),
    ).length;

    candidates.push({ concept, facts: units, calendarFactCount });
  }

  const best = candidates.sort((a, b) => b.calendarFactCount - a.calendarFactCount)[0];
  if (!best) {
    throw new Error(`No supported revenue concept found for ${companyFacts.entityName}`);
  }

  return { concept: best.concept, facts: best.facts };
}

function pickDirectFrameFact(facts, frame) {
  const candidates = facts
    .filter((fact) => {
      if (fact.frame !== frame || !['10-Q', '10-K'].includes(fact.form)) {
        return false;
      }

      const duration = fact.start ? daysBetween(fact.start, fact.end) : 0;
      const filingLag = daysAfter(fact.end, fact.filed);
      return duration >= 70 && duration <= 105 && filingLag >= 0;
    })
    .sort((a, b) => a.filed.localeCompare(b.filed));

  const timelyCandidates = candidates.filter((fact) => daysAfter(fact.end, fact.filed) <= 150);
  return (timelyCandidates.length > 0 ? timelyCandidates : candidates).at(-1);
}

function pickDirectPeriodFact(facts, quarterId) {
  const period = periodByQuarter[quarterId];
  const frame = frameByQuarter[quarterId];
  const candidates = facts
    .filter((fact) => {
      if (!['10-Q', '10-K'].includes(fact.form) || !fact.start) {
        return false;
      }

      if (fact.frame && fact.frame !== frame) {
        return false;
      }

      const duration = daysBetween(fact.start, fact.end);
      const filingLag = daysAfter(fact.end, fact.filed);
      return (
        duration >= 70 &&
        duration <= 105 &&
        fact.end >= period.starts_on &&
        fact.end <= period.ends_on &&
        filingLag >= 0 &&
        filingLag <= 150
      );
    })
    .sort((a, b) => a.filed.localeCompare(b.filed));

  return candidates.at(-1);
}

function pickAnnualFact(facts) {
  const candidates = facts
    .filter((fact) => {
      if (fact.frame !== `CY${calendarYear}` || !['10-K', '20-F', '40-F'].includes(fact.form)) {
        return false;
      }

      const duration = fact.start ? daysBetween(fact.start, fact.end) : 0;
      return duration >= 330 && duration <= 380;
    })
    .sort((a, b) => a.filed.localeCompare(b.filed));

  return candidates.at(-1);
}

function pickYtdFactBeforeAnnual(facts, annualFact) {
  const candidates = facts
    .filter((fact) => {
      if (!fact.start || !['10-Q', '10-K'].includes(fact.form)) {
        return false;
      }

      const duration = daysBetween(fact.start, fact.end);
      return (
        fact.start === annualFact.start &&
        fact.end < annualFact.end &&
        duration > 105 &&
        duration < 330
      );
    })
    .sort((a, b) => a.end.localeCompare(b.end));

  return candidates.at(-1);
}

function buildReport(company, submissions, companyFacts, quarterId, fact, options = {}) {
  const filing = getFilingByAccession(submissions, fact.accn);

  return {
    company_id: company.id,
    reporting_period_id: quarterId,
    reporting_period_label: reportingPeriods.find((period) => period.id === quarterId).label,
    calendar_frame: frameByQuarter[quarterId],
    total_revenue_billions: roundBillions(fact.val),
    revenue_fact_concept: options.concept,
    revenue_derivation: options.derivation ?? 'direct_sec_calendar_frame',
    source: 'SEC EDGAR XBRL',
    source_type: 'sec_filing',
    form_type: filing.form_type,
    accession_number: fact.accn,
    filing_date: filing.filing_date,
    period_end_date: filing.period_end_date,
    primary_document: filing.primary_document,
    primary_document_url: secArchiveUrl(company.cik, fact.accn, filing.primary_document),
    filing_detail_url: secFilingDetailUrl(company.cik, fact.accn),
    metadata: {
      ticker: company.ticker,
      cik: company.cik,
      fiscal_year_end: submissions.fiscalYearEnd,
      sic: submissions.sic,
      sic_description: submissions.sicDescription,
      sec_file_number: filing.metadata.sec_file_number,
      sec_film_number: filing.metadata.sec_film_number,
      xbrl_start: fact.start,
      xbrl_end: fact.end,
      xbrl_frame: fact.frame,
      xbrl_fiscal_year: fact.fy,
      xbrl_fiscal_period: fact.fp,
      computed_from: options.computedFrom,
    },
  };
}

function extractCalendarReports(company, submissions, companyFacts) {
  const { concept, facts } = getRevenueFacts(companyFacts);
  const reports = [];

  for (const quarterId of quarterIds) {
    const fact = pickDirectFrameFact(facts, frameByQuarter[quarterId]) ?? pickDirectPeriodFact(facts, quarterId);

    if (fact) {
      reports.push(buildReport(company, submissions, companyFacts, quarterId, fact, { concept }));
      continue;
    }

    const annualFact = pickAnnualFact(facts);
    if (!annualFact) {
      throw new Error(`No direct or annual CY${calendarYear} revenue fact for ${company.ticker} ${quarterId}`);
    }

    const ytdFact = pickYtdFactBeforeAnnual(facts, annualFact);
    if (!ytdFact) {
      throw new Error(`No YTD fact to derive ${company.ticker} ${quarterId} from ${annualFact.accn}`);
    }

    reports.push(
      buildReport(
        company,
        submissions,
        companyFacts,
        quarterId,
        { ...annualFact, val: annualFact.val - ytdFact.val },
        {
          concept,
          derivation: 'annual_cy_minus_prior_ytd_same_fiscal_year',
          computedFrom: [annualFact.accn, ytdFact.accn],
        },
      ),
    );
  }

  return reports;
}

function sqlValue(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

function buildSeedSql(reports) {
  const companyRows = companies
    .map(
      (company) =>
        `(${sqlValue(company.id)}, ${sqlValue(company.name)}, ${sqlValue(company.ticker)}, ${sqlValue(company.cik)}, ${sqlValue(company.accentColor)})`,
    )
    .join(',\n');

  const periodRows = reportingPeriods
    .map(
      (period) =>
        `(${sqlValue(period.id)}, ${sqlValue(period.label)}, ${period.calendar_year}, ${period.quarter_number}, ${sqlValue(period.starts_on)}, ${sqlValue(period.ends_on)})`,
    )
    .join(',\n');

  const reportRows = reports
    .map(
      (report) =>
        `(${sqlValue(report.company_id)}, ${sqlValue(report.reporting_period_id)}, ${sqlValue(report.source)}, ${sqlValue(report.source_type)}, ${sqlValue(report.form_type)}, ${sqlValue(report.accession_number)}, ${sqlValue(report.filing_date)}, ${sqlValue(report.period_end_date)}, ${sqlValue(report.primary_document)}, ${sqlValue(report.primary_document_url)}, ${sqlValue(report.filing_detail_url)}, ${sqlValue(report.metadata)}, ${sqlValue(report.calendar_frame)}, ${report.total_revenue_billions}, ${sqlValue(report.revenue_fact_concept)}, ${sqlValue(report.revenue_derivation)})`,
    )
    .join(',\n');

  const revenueRows = reports
    .map(
      (report) =>
        `(${sqlValue(report.company_id)}, ${sqlValue(report.reporting_period_id)}, ${report.total_revenue_billions}, 'SEC EDGAR XBRL', (select id from public.financial_reports where accession_number = ${sqlValue(report.accession_number)} limit 1))`,
    )
    .join(',\n');

  return `insert into public.companies (id, name, ticker, cik, accent_color)
values
${companyRows}
on conflict (id) do update set
  name = excluded.name,
  ticker = excluded.ticker,
  cik = excluded.cik,
  accent_color = excluded.accent_color,
  updated_at = now();

insert into public.reporting_periods (id, label, calendar_year, quarter_number, starts_on, ends_on)
values
${periodRows}
on conflict (id) do update set
  label = excluded.label,
  calendar_year = excluded.calendar_year,
  quarter_number = excluded.quarter_number,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on;

insert into public.financial_reports (
  company_id,
  reporting_period_id,
  source,
  source_type,
  form_type,
  accession_number,
  filing_date,
  period_end_date,
  primary_document,
  primary_document_url,
  filing_detail_url,
  metadata,
  calendar_frame,
  total_revenue_billions,
  revenue_fact_concept,
  revenue_derivation
)
values
${reportRows}
on conflict (accession_number) do update set
  company_id = excluded.company_id,
  reporting_period_id = excluded.reporting_period_id,
  source = excluded.source,
  source_type = excluded.source_type,
  form_type = excluded.form_type,
  filing_date = excluded.filing_date,
  period_end_date = excluded.period_end_date,
  primary_document = excluded.primary_document,
  primary_document_url = excluded.primary_document_url,
  filing_detail_url = excluded.filing_detail_url,
  metadata = excluded.metadata,
  calendar_frame = excluded.calendar_frame,
  total_revenue_billions = excluded.total_revenue_billions,
  revenue_fact_concept = excluded.revenue_fact_concept,
  revenue_derivation = excluded.revenue_derivation,
  updated_at = now();

insert into public.company_quarter_revenue (
  company_id,
  reporting_period_id,
  total_revenue_billions,
  source,
  financial_report_id
)
values
${revenueRows}
on conflict (company_id, reporting_period_id) do update set
  total_revenue_billions = excluded.total_revenue_billions,
  source = excluded.source,
  financial_report_id = excluded.financial_report_id,
  updated_at = now();
`;
}

function buildCyRevenueTotals(reports) {
  const totals = {};

  for (const company of companies) {
    totals[company.id] = quarterIds.map((quarterId) => {
      const report = reports.find(
        (candidate) =>
          candidate.company_id === company.id && candidate.reporting_period_id === quarterId,
      );
      return report.total_revenue_billions;
    });
  }

  return totals;
}

async function upsertToSupabase(reports) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { skipped: true, reason: 'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { error: companyError } = await supabase.from('companies').upsert(
    companies.map((company) => ({
      id: company.id,
      name: company.name,
      ticker: company.ticker,
      cik: company.cik,
      accent_color: company.accentColor,
    })),
  );
  if (companyError) throw companyError;

  const { error: periodError } = await supabase.from('reporting_periods').upsert(reportingPeriods);
  if (periodError) throw periodError;

  const { error: reportError } = await supabase
    .from('financial_reports')
    .upsert(reports, { onConflict: 'accession_number' });
  if (reportError) throw reportError;

  const { data: reportIds, error: reportIdError } = await supabase
    .from('financial_reports')
    .select('id, accession_number')
    .in(
      'accession_number',
      reports.map((report) => report.accession_number),
    );
  if (reportIdError) throw reportIdError;

  const reportIdByAccession = Object.fromEntries(
    reportIds.map((report) => [report.accession_number, report.id]),
  );

  const { error: revenueError } = await supabase.from('company_quarter_revenue').upsert(
    reports.map((report) => ({
      company_id: report.company_id,
      reporting_period_id: report.reporting_period_id,
      total_revenue_billions: report.total_revenue_billions,
      source: 'SEC EDGAR XBRL',
      financial_report_id: reportIdByAccession[report.accession_number],
    })),
    { onConflict: 'company_id,reporting_period_id' },
  );
  if (revenueError) throw revenueError;

  return { skipped: false };
}

async function main() {
  const reports = [];

  for (const company of companies) {
    const { submissions, companyFacts } = await fetchCompanyPayload(company);
    reports.push(...extractCalendarReports(company, submissions, companyFacts));
  }

  await mkdir('supabase', { recursive: true });
  await mkdir('src/data', { recursive: true });

  await writeFile('supabase/seed.sql', buildSeedSql(reports));
  await writeFile(
    'src/data/secReportSources.ts',
    `export const secReportSources = ${JSON.stringify(reports, null, 2)} as const;\n`,
  );
  await writeFile(
    'src/data/cyRevenueTotals.ts',
    `export const cyRevenueTotals = ${JSON.stringify(buildCyRevenueTotals(reports), null, 2)} as const;\n`,
  );

  const result = await upsertToSupabase(reports);
  console.log(
    JSON.stringify(
      {
        reportCount: reports.length,
        generatedFiles: [
          'supabase/seed.sql',
          'src/data/secReportSources.ts',
          'src/data/cyRevenueTotals.ts',
        ],
        supabase: result,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
