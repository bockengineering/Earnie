alter table public.financial_reports
  add column if not exists calendar_frame text,
  add column if not exists total_revenue_billions numeric(14, 3),
  add column if not exists revenue_fact_concept text,
  add column if not exists revenue_derivation text;

alter table public.company_quarter_revenue
  alter column total_revenue_billions type numeric(14, 3);

alter table public.segment_revenue
  alter column revenue_billions type numeric(14, 3);

alter table public.segment_line_items
  alter column revenue_billions type numeric(14, 3);

create index if not exists financial_reports_calendar_frame_idx
  on public.financial_reports(calendar_frame);
