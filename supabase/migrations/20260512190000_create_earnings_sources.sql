create extension if not exists pgcrypto;

create table if not exists public.companies (
  id text primary key,
  name text not null,
  ticker text not null unique,
  cik text not null unique,
  accent_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reporting_periods (
  id text primary key,
  label text not null unique,
  calendar_year integer not null,
  quarter_number integer not null check (quarter_number between 1 and 4),
  starts_on date not null,
  ends_on date not null
);

create table if not exists public.financial_reports (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  reporting_period_id text not null references public.reporting_periods(id) on delete cascade,
  source text not null default 'SEC EDGAR',
  source_type text not null default 'sec_filing',
  form_type text not null,
  accession_number text not null unique,
  filing_date date not null,
  period_end_date date not null,
  primary_document text not null,
  primary_document_url text not null,
  filing_detail_url text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, reporting_period_id, form_type)
);

create table if not exists public.company_quarter_revenue (
  id uuid primary key default gen_random_uuid(),
  company_id text not null references public.companies(id) on delete cascade,
  reporting_period_id text not null references public.reporting_periods(id) on delete cascade,
  total_revenue_billions numeric(14, 2) not null,
  source text not null default 'mock',
  financial_report_id uuid references public.financial_reports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, reporting_period_id)
);

create table if not exists public.segment_revenue (
  id uuid primary key default gen_random_uuid(),
  company_quarter_revenue_id uuid not null references public.company_quarter_revenue(id) on delete cascade,
  name text not null,
  revenue_billions numeric(14, 2) not null,
  color text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_quarter_revenue_id, name)
);

create table if not exists public.segment_line_items (
  id uuid primary key default gen_random_uuid(),
  segment_revenue_id uuid not null references public.segment_revenue(id) on delete cascade,
  name text not null,
  revenue_billions numeric(14, 2) not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (segment_revenue_id, name)
);

create index if not exists financial_reports_company_period_idx
  on public.financial_reports(company_id, reporting_period_id);

create index if not exists company_quarter_revenue_company_period_idx
  on public.company_quarter_revenue(company_id, reporting_period_id);

alter table public.companies enable row level security;
alter table public.reporting_periods enable row level security;
alter table public.financial_reports enable row level security;
alter table public.company_quarter_revenue enable row level security;
alter table public.segment_revenue enable row level security;
alter table public.segment_line_items enable row level security;

drop policy if exists "Public companies are readable" on public.companies;
create policy "Public companies are readable"
  on public.companies for select
  to anon, authenticated
  using (true);

drop policy if exists "Public reporting periods are readable" on public.reporting_periods;
create policy "Public reporting periods are readable"
  on public.reporting_periods for select
  to anon, authenticated
  using (true);

drop policy if exists "Public financial reports are readable" on public.financial_reports;
create policy "Public financial reports are readable"
  on public.financial_reports for select
  to anon, authenticated
  using (true);

drop policy if exists "Public company revenue is readable" on public.company_quarter_revenue;
create policy "Public company revenue is readable"
  on public.company_quarter_revenue for select
  to anon, authenticated
  using (true);

drop policy if exists "Public segment revenue is readable" on public.segment_revenue;
create policy "Public segment revenue is readable"
  on public.segment_revenue for select
  to anon, authenticated
  using (true);

drop policy if exists "Public segment line items are readable" on public.segment_line_items;
create policy "Public segment line items are readable"
  on public.segment_line_items for select
  to anon, authenticated
  using (true);
