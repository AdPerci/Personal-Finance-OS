# Adam Finance

A private personal finance dashboard built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Supabase, and Recharts.

Track net worth, investments, pensions, savings, debts, and financial goals — starting with Trading 212 integration and manual accounts.

## Features (MVP)

- Supabase Auth (email/password + Google OAuth)
- Dashboard with net worth, assets, liabilities, and monthly change
- Manual account and liability management
- Trading 212 integration (ISA + Invest) with encrypted credential storage
- Daily net worth snapshots and history charts
- Asset allocation chart by category
- Light/dark mode, responsive mobile + desktop UI

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (preset `b7DMsHVFA`)
- **Database & Auth:** Supabase PostgreSQL + Supabase Auth
- **Charts:** Recharts
- **Deployment:** Vercel

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in `supabase/migrations/001_initial_schema.sql` via the SQL Editor
3. Enable **Email** auth (optional: disable email confirmation for local dev)
4. Enable **Google** OAuth:
   - Add Google OAuth credentials in Supabase → Authentication → Providers
   - Set redirect URL: `http://localhost:3000/auth/callback`

### 3. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`) — recommended |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy anon JWT — works as fallback if publishable key not set |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Secret/elevated key (optional for MVP) |
| `CREDENTIALS_ENCRYPTION_KEY` | 64-char hex key (only if storing T212 keys via UI) |
| `TRADING212_API_KEY` | Trading 212 API key (server-only) |
| `TRADING212_SECRET_KEY` | Trading 212 API secret (server-only) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Connect Trading 212

**Option A — environment variables (recommended for personal deployment)**

Add to `.env.local` (server-only, never committed):

```bash
TRADING212_API_KEY=your-api-key
TRADING212_SECRET_KEY=your-api-secret
# Optional: TRADING212_ENVIRONMENT=live|demo
# Optional: TRADING212_SUBTYPE=isa|invest
# Optional: TRADING212_LABEL=My ISA
```

Then go to **Settings → Integrations** and click **Connect & Sync** (no need to enter keys in the UI).

**Option B — per-user encrypted storage**

Enter API key and secret in the integrations form. Credentials are encrypted with `CREDENTIALS_ENCRYPTION_KEY` and stored in Supabase.

> The Trading 212 Public API currently supports **Invest and Stocks ISA only**.

## Project Structure

```
src/
  app/              # Next.js App Router pages and API routes
  components/       # UI components (dashboard, forms, layout)
  lib/
    finance/        # Net worth, allocation, snapshot calculations
    services/       # Provider integrations (Trading 212)
    supabase/       # Supabase client utilities
  types/            # TypeScript types and taxonomy
supabase/
  migrations/       # Database schema
```

## Security

- Broker API keys are **never** exposed to the browser
- Credentials encrypted at rest with AES-256-GCM
- All external API calls are server-side only
- Row Level Security on all Supabase tables

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.local.example`
4. Add production URL to Supabase Auth redirect allowlist: `https://your-domain.vercel.app/auth/callback`

## Customising Theme

The app uses shadcn/ui preset `b7DMsHVFA`. To change the accent colour, edit `--primary` and `--ring` in `src/app/globals.css`.

## Roadmap

See `docs/product-vision.md` for the full Adam Finance taxonomy and phased roadmap (pensions, FIRE date, dividend forecast, and more).
