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
MEGAPAY_API_KEY=your-server-only-megapay-api-key
MEGAPAY_EMAIL=your-megapay-account-email
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in client code. `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are passed from the server to the browser auth client; the publishable key is intended for browser use and is not a secret. The service-role key is used for private username-to-email lookup; passwords are handled by Supabase Auth and are never stored by this app.

Without the Supabase URL and anon key, the site's account forms still open but submission is disabled. The username login lookup also requires the service-role key.

## MegaPay App Wallet Deposits

Apply all SQL migrations, including `202610200001_megapay_wallet.sql`, before enabling deposits. Configure `MEGAPAY_API_KEY` and `MEGAPAY_EMAIL` from your MegaPay account as server-side environment variables. Never expose the MegaPay key to browser code or commit real credentials.

The wallet is a separate app-owned USD ledger and does not fund or read a Deriv account. MegaPay's documented API supports Kenyan M-Pesa STK deposits and transaction-status checks; the documented wallet section says wallet-operation APIs are not yet available. Bank-agent, crypto, and withdrawals therefore remain unavailable. Deposits require at least $2.00 and use the configured fixed rate of $1 = KES 131.21; the STK amount is rounded up to whole KES, and the selected USD amount is credited only after verifying that exact KES payment. Status checks use MegaPay's server-to-server transaction-status endpoint because the documented webhook payload has no signature-verification mechanism.

Add the MegaPay variables to the deployment environment and redeploy only after applying the migration. Until both are configured, deposit initiation returns a configuration error; no test credentials from the public docs should be used.

## Admin and Manual Withdrawals

Apply `202610200003_admin_withdrawals.sql` after the wallet migrations. Admins are managed in `public.site_admins`; no user or email is hardcoded in migrations. To grant one existing Supabase user access, resolve their email from `auth.users` using their UUID in a one-time SQL statement. This does not create an account or set a password; manage credentials in Supabase Auth.

Users can request an M-Pesa withdrawal from App Wallet. The amount is reserved immediately; admin rejection restores it. Admin approval does not claim money was sent: after the manual M-Pesa transfer, the admin must enter its payout reference to mark the request paid. App Wallet funds remain separate from the demo trading balance; demo trades are not real Deriv trades.

## Deploy to Vercel

Import this repository into Vercel with the repository root as the Root Directory and `main` as the Production Branch. Vercel detects Next.js automatically; the build command is `npm run build` and the install command is `npm install`.

Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MEGAPAY_API_KEY`, and `MEGAPAY_EMAIL` in the Vercel project's **Production** Environment Variables, then redeploy. Add the same values to Preview if preview deployments need account functionality. Never upload or commit `.env.production`; `.env.example` lists the supported variables. Both the service-role key and MegaPay credentials must remain server-only.

In Supabase **Authentication → URL Configuration**, set the Site URL to the production deployment's domain. A successful build without Supabase variables can still deploy, but account form submissions and username login lookup will not work.

## Run Locally

```bash
npm install
npm run dev
```

The app is available at `http://localhost:3000`.

## Account and Trading Model

New site accounts receive a virtual USD 10,000 demo wallet. Demo trades use public market quotes and are recorded in the user's Supabase-backed paper-trade history. The Deriv real account is a placeholder and remains unavailable until a regulated funding and execution provider is integrated. MegaPay deposits credit only the separate app wallet described above; they do not change the Deriv balance or enable real trading.

Demo trades use the editable duration selected for that trade (minimum 15 seconds); tick-duration contracts are not offered. Each trade stores its own `duration_seconds` and expiry in Supabase, so changing the duration for a later trade does not alter existing trades. At settlement, a winning trade credits the quoted gross payout (including the returned stake); a losing trade receives no payout and its stake remains deducted.

Deriv's public WebSocket is used for market symbols, quotes, and chart data only. No Deriv App ID, API token, or OAuth redirect URI is required for site login.

## Production Build

```bash
npm run build
npm start
```
