# Ignite 26

Frontend: React + TypeScript + Vite  
Backend/API routes: serverless handlers in `api/` (SQLite-backed)

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+

## Setup

```bash
npm install
```

## Run Locally

Start frontend + local API server together:

```bash
npm run dev
```

By default:

- Frontend: `http://localhost:5173`
- API: `http://127.0.0.1:8787` (proxied from frontend as `/api`)

## Build for Production

```bash
npm run build
```

## Testing / Verification

This repo currently has no dedicated unit/integration test runner (`test` script is not defined in `package.json`).
Use the following quality checks:

```bash
npm run lint
npm run build
```

## Environment Variables (API)

The serverless API layer now uses local SQLite:

- `SQLITE_DB_PATH` (example: `./data/ignite26.db`)
- `GOOGLE_SHEET_SYNC_URL` (optional Google Sheet URL for sync pull)
- `SHEET_SYNC_SECRET` (optional secret for Apps Script webhook push)
- `VALIDATION_HANDLER_PASSWORD` (default password for hidden `/validate/:token` handler page)

On first run, tables are auto-created and a default admin is seeded:

- email: `admin@ignite26.edu.in`
- password: `admin123`

## Current Status (checked on March 4, 2026)

Commands executed:

- `npm run build` -> passes
- `npm run lint` -> still has existing lint issues in some frontend files

## Google Sheet Sync

API route: `POST /api/sheet-sync`

- Admin-triggered pull sync:
  - Uses `GOOGLE_SHEET_SYNC_URL` from `.env`, or pass `{ "sheet_url": "..." }`
- Webhook push sync (for Apps Script):
  - Send JSON with `{ "rows": [...] }` or `{ "row": {...} }`
  - Include `X-Sheet-Sync-Secret: <SHEET_SYNC_SECRET>`

Example Apps Script webhook call:

```javascript
function pushLatestRows(rows) {
  const url = 'https://your-domain.com/api/sheet-sync';
  const payload = JSON.stringify({
    sync_secret: 'YOUR_SECRET',
    rows: rows
  });
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  });
}
```
