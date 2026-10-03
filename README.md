# Rise/Fall Trading App

A self-hosted Rise/Fall trading app with site-owned accounts, Supabase authentication, demo-wallet paper trading, and live Deriv market data. User login and signup use Supabase Auth; the app does not require Deriv OAuth or redirect users to Deriv to create or access a site account.

## Requirements

- Node.js 20.9.0 or later (required by Next.js 16)
- A Supabase project

## Configure Supabase

1. Create a Supabase project and enable email/password authentication.
2. In **Authentication → URL Configuration**, set the Site URL to your deployment URL. For local development, use `http://localhost:3000`.
3. Apply the SQL files in [`supabase/migrations/`](supabase/migrations/) in filename order in the Supabase SQL Editor, or deploy the migrations with the Supabase CLI. The latest migration ensures each demo trade uses the duration submitted for that trade.
4. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings → API**:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in client code. `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are passed from the server to the browser auth client; the publishable key is intended for browser use and is not a secret. The service-role key is used for private username-to-email lookup; passwords are handled by Supabase Auth and are never stored by this app.

Without the Supabase URL and anon key, the site's account forms still open but submission is disabled. The username login lookup also requires the service-role key.

## Deploy to Vercel

Import this repository into Vercel with the repository root as the Root Directory and `main` as the Production Branch. Vercel detects Next.js automatically; the build command is `npm run build` and the install command is `npm install`.

Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the Vercel project's **Production** Environment Variables, then redeploy. Add the same values to Preview if preview deployments need account functionality. Never upload or commit `.env.production`; `.env.example` lists the supported variables. The service-role key must remain server-only.

In Supabase **Authentication → URL Configuration**, set the Site URL to the production deployment's domain. A successful build without Supabase variables can still deploy, but account form submissions and username login lookup will not work.

## Run Locally

```bash
npm install
npm run dev
```

The app is available at `http://localhost:3000`.

## Account and Trading Model

New site accounts receive a virtual USD 10,000 demo wallet. Demo trades use public market quotes and are recorded in the user's Supabase-backed paper-trade history. The real account is a placeholder and remains unavailable until a regulated funding and execution provider is integrated. Supabase balance records are not real-money funds.

Demo trades use the editable duration selected for that trade (minimum 15 seconds); tick-duration contracts are not offered. Each trade stores its own `duration_seconds` and expiry in Supabase, so changing the duration for a later trade does not alter existing trades. At settlement, a winning trade credits the quoted gross payout (including the returned stake); a losing trade receives no payout and its stake remains deducted.

Deriv's public WebSocket is used for market symbols, quotes, and chart data only. No Deriv App ID, API token, or OAuth redirect URI is required for site login.

## Production Build

```bash
npm run build
npm start
```
