# Earnie

Earnie is a React dashboard that visualizes how public company quarterly revenue flows from the company total into business segments and segment-level revenue lines.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Custom SVG flow visualization
- Local mock data

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

Data Source: Mock financial data, replace with SEC/company filings.

The mock model lives in `src/data/earningsData.ts` and is structured so company metadata, quarters, segment revenue, and line-item revenue can be replaced later with real filing data.

## Future Data Source Plan

Future versions can swap the local data module for SEC/company earnings data. If persistence becomes useful, Supabase can store company metadata, quarters, segment revenue lines, notes, and saved views while keeping the app functional with mock data when environment variables are unavailable.

## Deployment

Vercel deployment URL: Pending deployment.
