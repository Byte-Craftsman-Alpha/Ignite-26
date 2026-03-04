# Ignite 26

Frontend: React + TypeScript + Vite  
Backend/API routes: serverless handlers in `api/` (Supabase-backed)

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+

## Setup

```bash
npm install
```

## Run Locally

Start the Vite dev server:

```bash
npm run dev
```

By default, the app runs at:

`http://localhost:5173`

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

The serverless API layer expects these variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_DB_SCHEMA`
- `SUPABASE_SERVICE_ROLE_KEY`

## Participants Schema Migration

To apply the updated registration schema, run `database/participants_schema_update.sql` in the Supabase SQL editor.

## Current Status (checked on March 4, 2026)

Commands executed:

- `npm run lint` -> fails with ESLint errors (mainly `no-explicit-any` and one `set-state-in-effect` issue).
- `npm run build` -> fails with TypeScript errors due to missing type declarations for `lucide-react`.

If you want, I can fix these issues and make lint/build pass in a follow-up.
