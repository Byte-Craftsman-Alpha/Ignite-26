# Ignite 26

Frontend: React + TypeScript + Vite  
Backend/API: Single Vercel entrypoint in `api/index.js` dispatching handlers in `server/` (SQLite-backed).

## Vercel Hobby Plan

- Keep only the single Vercel entrypoint in `api/index.js`.
- Add new backend handlers under `server/`, then register them in `server/router.js`.
- Do not add extra executable files under `api/`, or Vercel will count them as more Serverless Functions.

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

No dedicated unit/integration test runner is configured (`test` script is not defined).
Suggested checks:

```bash
npm run lint
npm run build
```

## Environment Variables (API)

Required for local dev:

- `SQLITE_DB_PATH` (example: `./data/ignite26.db`)
- `ADMIN_EMAIL` (seeded on first run)
- `ADMIN_PASSWORD` (seeded on first run)

Optional:

- `TURSO_DATABASE_URL` (remote libSQL/Turso)
- `TURSO_AUTH_TOKEN` (if using Turso)
- `API_BODY_LIMIT` (default 25mb)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (OTP + confirmation emails)
- `GOOGLE_SHEET_SYNC_URL` (sync pull from Google Sheet)
- `SHEET_SYNC_SECRET` (Apps Script webhook push secret)
- `VALIDATION_HANDLER_PASSWORD` (default password for `/validate/:token` handler page)

Media uploads on Vercel:

- `BLOB_READ_WRITE_TOKEN` is required to store uploaded media using Vercel Blob.
- Without this token on Vercel, uploads will fail because the filesystem is read-only.

## Event Settings

Admin page:

- `/admin/event-settings`

API:

- `GET /api/event-settings` (public)
- `PUT /api/event-settings` (admin only)

Settings include:

- Title, venue, display date/time
- Countdown datetime
- Dress codes
- Day flow timeline
- Support note

## Participant Uniqueness Rules

- `email` is unique.
- `roll_number` is allowed to repeat.
- `whatsapp_number` is allowed to repeat.

Registration behavior:

- A registration with an existing `email` is rejected.
- An existing participant may be updated only when both `roll_number` and `email` match.

## Event Pass (PNG) + QR

- Passes are generated as **PNG** using a template image (`/public/event-pass.png`).
- QR code is rendered on the pass canvas via the `qrcode` library.

QR scan reliability:

- A **quiet zone** is included via `margin: 4`.
- QR colors use a scanner-friendly scheme (`dark: #000000`, `light: #dcc073`).

Where this is implemented:

- `src/pages/MyProfile.tsx` (single participant download)
- `src/pages/admin/BulkPassDownload.tsx` (bulk ZIP generation)

## Admin: Bulk Pass Download

Page:

- `/admin/bulk-passes`

Behavior:

- Select one or more participants.
- Download all passes as a single ZIP (generated client-side via `jszip`).

## Payment / Check-in Handler (Validation Handler)

Page:

- `/validate/:token`

Behavior:

- After unlocking, the handler preloads participant data once and stores it in encrypted localStorage.
- Subsequent scans/searches use the local cache to avoid repeated server fetches.
- Cache can be refreshed manually from the page.

Security notes:

- Cache is encrypted using Web Crypto (`AES-GCM`) with a key derived from the handler password.
- Tampering results in decryption failure and forces a refetch.

Implementation:

- Client: `src/pages/ValidationHandler.tsx`
- API: `server/validation-handler.js`

## Admin Dashboard: Mobile Menu Positioning

Admin dashboard dropdowns (Quick Links / Data Tools / Access Options / Handler Options) clamp their position so menus stay inside the viewport on mobile.

## Media Upload Behavior

- Public uploads are stored with status `pending` and require admin approval.
- Admin uploads are stored with status `approved`.
- On local dev, uploads are written to `public/uploads`.
- On Vercel, uploads use Vercel Blob (requires `BLOB_READ_WRITE_TOKEN`).

## Google Sheet Sync

API route: `POST /api/sheet-sync`

- Admin-triggered pull sync:
  - Uses `GOOGLE_SHEET_SYNC_URL` from `.env`, or pass `{ "sheet_url": "..." }`.
- Webhook push sync (for Apps Script):
  - Send JSON with `{ "rows": [...] }` or `{ "row": {...} }`.
  - Include `X-Sheet-Sync-Secret: <SHEET_SYNC_SECRET>`.

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

## Sync Google Form Responses to Database

```javascript
const API_URL = 'API_ENDPOINT'; // or your local tunnel URL
const SECRET = 'SECRET_KEY'; // same as .env SHEET_SYNC_SECRET
const SHEET_NAME = 'SHEET_NAME'; // change if needed

function onFormSubmit(e) {
  const row = e && e.namedValues ? namedValuesToRow(e.namedValues) : null;
  if (!row) return;
  pushRows([row]);
}

function syncAllRowsNow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet not found: ${SHEET_NAME}`);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;

  const headers = values[0].map(h => String(h || '').trim());
  const allRows = values.slice(1).map(r => rowArrayToObject(headers, r));

  // CHUNK CONFIGURATION
  const chunkSize = 1; // Try 50 rows at a time
  for (let i = 0; i < allRows.length; i += chunkSize) {
    const chunk = allRows.slice(i, i + chunkSize);
    Logger.log(`Syncing rows ${i + 1} of ${allRows.length}...`);
    pushRows(chunk);
  }
}

function pushRows(rows) {
  Logger.log(rows);
  const res = UrlFetchApp.fetch(API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Sheet-Sync-Secret': SECRET },
    payload: JSON.stringify({ rows }),
    muteHttpExceptions: true
  });

  Logger.log(`Sync status: ${res.getResponseCode()}`);
  Logger.log(res.getContentText());
}

function namedValuesToRow(namedValues) {
  const out = {};
  Object.keys(namedValues).forEach(k => {
    const val = namedValues[k];
    out[k] = Array.isArray(val) ? val.join(', ') : String(val || '');
  });
  return out;
}

function rowArrayToObject(headers, row) {
  const out = {};
  headers.forEach((h, i) => {
    out[h] = row[i] == null ? '' : String(row[i]);
  });
  return out;
}
```

## Status

- Last known checks were on March 4, 2026.
- Build passed, lint had existing issues at that time.
- This README has not been re-verified since then.
