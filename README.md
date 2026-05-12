# Earnie

Earnie is a React dashboard that visualizes how public company quarterly revenue flows from the company total into business segments and segment-level revenue lines.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Custom SVG flow visualization
- Local mock data
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

Data Source: Mock financial data with SEC EDGAR filing links, replace with parsed SEC/company filing values.

The mock model lives in `src/data/earningsData.ts` and is structured so company metadata, quarters, segment revenue, and line-item revenue can be replaced later with real filing data. SEC filing source metadata lives in `src/data/secReportSources.ts`.

## Database And Report Ingestion

The Supabase/Postgres schema is in `supabase/migrations/20260512190000_create_earnings_sources.sql`.

To refresh report source metadata from SEC EDGAR:

```bash
npm run ingest:sec-reports
```

The script fetches public SEC submissions metadata for the 10 starter companies, writes `supabase/seed.sql`, and writes the local typed fallback data file. If `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present, it also upserts the records into Supabase.

## Future Data Source Plan

Future versions can parse XBRL and company earnings releases into the `company_quarter_revenue`, `segment_revenue`, and `segment_line_items` tables. The app remains functional with mock data when Supabase environment variables are unavailable.

## Deployment

Vercel deployment URL: https://earnie-rose.vercel.app
