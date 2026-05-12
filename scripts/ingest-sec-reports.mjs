import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'node:fs/promises';

const SEC_USER_AGENT =
  process.env.SEC_USER_AGENT ?? 'Earnie financial report ingestion contact@example.com';

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
  { id: 'q1_2025', label: 'Q1 2025', calendar_year: 2025, quarter_number: 1, starts_on: '2025-01-01', ends_on: '2025-03-31' },
  { id: 'q2_2025', label: 'Q2 2025', calendar_year: 2025, quarter_number: 2, starts_on: '2025-04-01', ends_on: '2025-06-30' },
  { id: 'q3_2025', label: 'Q3 2025', calendar_year: 2025, quarter_number: 3, starts_on: '2025-07-01', ends_on: '2025-09-30' },
  { id: 'q4_2025', label: 'Q4 2025', calendar_year: 2025, quarter_number: 4, starts_on: '2025-10-01', ends_on: '2025-12-31' },
];

const periodIdForDate = (date) => {
  const month = Number(date.slice(5, 7));
  if (month <= 3) return 'q1_2025';
  if (month <= 6) return 'q2_2025';
  if (month <= 9) return 'q3_2025';
  return 'q4_2025';
};

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchSubmissions(company) {
  const response = await fetch(`https://data.sec.gov/submissions/CIK${company.cik}.json`, {
    headers: {
      'User-Agent': SEC_USER_AGENT,
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
  });

  if (!response.ok) {
    throw new Error(`SEC request failed for ${company.ticker}: ${response.status}`);
  }

  return response.json();
}

function extractReports(company, submissions) {
  const recent = submissions.filings.recent;
  const byPeriod = new Map();

  for (let index = 0; index < recent.accessionNumber.length; index += 1) {
    const formType = recent.form[index];
    const periodEndDate = recent.reportDate[index];

    if (!['10-Q', '10-K'].includes(formType) || !periodEndDate?.startsWith('2025')) {
      continue;
    }

    const reportingPeriodId = periodIdForDate(periodEndDate);
    if (byPeriod.has(reportingPeriodId)) {
      continue;
    }

    const accessionNumber = recent.accessionNumber[index];
    const primaryDocument = recent.primaryDocument[index];

    byPeriod.set(reportingPeriodId, {
      company_id: company.id,
      reporting_period_id: reportingPeriodId,
      source: 'SEC EDGAR',
      source_type: 'sec_filing',
      form_type: formType,
      accession_number: accessionNumber,
      filing_date: recent.filingDate[index],
      period_end_date: periodEndDate,
      primary_document: primaryDocument,
      primary_document_url: secArchiveUrl(company.cik, accessionNumber, primaryDocument),
      filing_detail_url: secFilingDetailUrl(company.cik, accessionNumber),
      metadata: {
        ticker: company.ticker,
        cik: company.cik,
        sec_file_number: recent.fileNumber[index],
        sec_film_number: recent.filmNumber[index],
        fiscal_year_end: submissions.fiscalYearEnd,
        sic: submissions.sic,
        sic_description: submissions.sicDescription,
      },
    });
  }

  return [...byPeriod.values()].sort((a, b) =>
    a.reporting_period_id.localeCompare(b.reporting_period_id),
  );
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
        `(${sqlValue(report.company_id)}, ${sqlValue(report.reporting_period_id)}, ${sqlValue(report.source)}, ${sqlValue(report.source_type)}, ${sqlValue(report.form_type)}, ${sqlValue(report.accession_number)}, ${sqlValue(report.filing_date)}, ${sqlValue(report.period_end_date)}, ${sqlValue(report.primary_document)}, ${sqlValue(report.primary_document_url)}, ${sqlValue(report.filing_detail_url)}, ${sqlValue(report.metadata)})`,
    )
    .join(',\n');

  return `insert into public.companies (id, name, ticker, cik, accent_color)\nvalues\n${companyRows}\non conflict (id) do update set\n  name = excluded.name,\n  ticker = excluded.ticker,\n  cik = excluded.cik,\n  accent_color = excluded.accent_color,\n  updated_at = now();\n\ninsert into public.reporting_periods (id, label, calendar_year, quarter_number, starts_on, ends_on)\nvalues\n${periodRows}\non conflict (id) do update set\n  label = excluded.label,\n  calendar_year = excluded.calendar_year,\n  quarter_number = excluded.quarter_number,\n  starts_on = excluded.starts_on,\n  ends_on = excluded.ends_on;\n\ninsert into public.financial_reports (\n  company_id,\n  reporting_period_id,\n  source,\n  source_type,\n  form_type,\n  accession_number,\n  filing_date,\n  period_end_date,\n  primary_document,\n  primary_document_url,\n  filing_detail_url,\n  metadata\n)\nvalues\n${reportRows}\non conflict (accession_number) do update set\n  company_id = excluded.company_id,\n  reporting_period_id = excluded.reporting_period_id,\n  source = excluded.source,\n  source_type = excluded.source_type,\n  form_type = excluded.form_type,\n  filing_date = excluded.filing_date,\n  period_end_date = excluded.period_end_date,\n  primary_document = excluded.primary_document,\n  primary_document_url = excluded.primary_document_url,\n  filing_detail_url = excluded.filing_detail_url,\n  metadata = excluded.metadata,\n  updated_at = now();\n`;
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

  return { skipped: false };
}

async function main() {
  const reports = [];

  for (const company of companies) {
    const submissions = await fetchSubmissions(company);
    reports.push(...extractReports(company, submissions));
    await sleep(150);
  }

  await mkdir('supabase', { recursive: true });
  await mkdir('src/data', { recursive: true });

  await writeFile('supabase/seed.sql', buildSeedSql(reports));
  await writeFile(
    'src/data/secReportSources.ts',
    `export const secReportSources = ${JSON.stringify(reports, null, 2)} as const;\n`,
  );

  const result = await upsertToSupabase(reports);
  console.log(
    JSON.stringify(
      {
        reportCount: reports.length,
        generatedFiles: ['supabase/seed.sql', 'src/data/secReportSources.ts'],
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
