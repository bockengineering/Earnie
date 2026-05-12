# Earnie

Earnie is a React dashboard that visualizes how public company quarterly revenue flows from the company total into business segments and segment-level revenue lines.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Custom SVG flow visualization
- SEC EDGAR XBRL top-line revenue data
- Supabase-ready schema and SEC filing ingestion script

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Current Data Source

Top-line company revenue totals are pulled from SEC EDGAR XBRL facts for calendar-year 2025 quarters (`CY2025Q1` through `CY2025Q4`) where available. For Q4 and other cases where SEC exposes the value as annual/YTD facts, the ingestion script derives the calendar quarter as annual revenue minus prior year-to-date revenue from the same fiscal year.

The v1 segment and line-item allocations remain structured estimates in `src/data/earningsData.ts` so the UI can render a complete flow while parsed segment disclosures are added. SEC filing source metadata lives in `src/data/secReportSources.ts`, and generated calendar-quarter totals live in `src/data/cyRevenueTotals.ts`.

## Database And Report Ingestion

The Supabase/Postgres schema is in `supabase/migrations/20260512190000_create_earnings_sources.sql` with calendar-revenue fields added in `supabase/migrations/20260512193000_add_calendar_revenue_fields.sql`.

To refresh report source metadata from SEC EDGAR:

```bash
npm run ingest:sec-reports
```

The script fetches public SEC submissions and company facts for the 10 starter companies, writes `supabase/seed.sql`, `src/data/secReportSources.ts`, and `src/data/cyRevenueTotals.ts`. If `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present, it also upserts the records into Supabase.

## Future Data Source Plan

Future versions can parse company segment disclosures and earnings-release tables into the `segment_revenue` and `segment_line_items` tables. The app remains functional from local generated data when Supabase environment variables are unavailable.

## Deployment

Vercel deployment URL: https://earnie-rose.vercel.app
