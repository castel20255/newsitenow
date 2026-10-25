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
PAYHERO_AUTH_TOKEN=your-server-only-payhero-basic-auth-token
PAYHERO_CHANNEL_ID=123
PAYHERO_C2B_PROVIDER=m-pesa
PAYHERO_NETWORK_CODE=63902
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it in client code. `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are passed from the server to the browser auth client; the publishable key is intended for browser use and is not a secret. The service-role key is used for private username-to-email lookup; passwords are handled by Supabase Auth and are never stored by this app.

Without the Supabase URL and anon key, the site's account forms still open but submission is disabled. The username login lookup also requires the service-role key.

## PayHero Wallet Payments

Apply every SQL migration in `supabase/migrations/` in filename order before enabling wallet payments, including `202610250001_wallet_payment_provider.sql`, `202610250002_payhero_withdrawals.sql`, and `202610250003_payhero_withdrawal_automation.sql`. New deposits always use PayHero C2B; historical deposits retain their stored provider for verification. Never expose payment credentials to browser code or commit real credentials.

The wallet is a separate app-owned USD ledger and does not fund or read a Deriv account. Deposits require at least the configured user minimum (at least $5.00) and use the fixed rate of $1 = KES 131.21; the STK amount is rounded up to whole KES, and USD is credited only after PayHero confirms payment through the transaction-status endpoint. Status checks use the provider's server-to-server endpoint.

Set `PAYHERO_AUTH_TOKEN` to the Basic auth token from PayHero, `PAYHERO_CHANNEL_ID` to the numeric channel ID, and `PAYHERO_NETWORK_CODE` to `63902` for M-Pesa. `PAYHERO_C2B_PROVIDER` defaults to `m-pesa`. Ensure the PayHero account and channel are enabled and funded for B2C withdrawals. User withdrawals are sent through PayHero B2C immediately after the wallet balance is reserved; users can check status, and confirmed failures automatically refund the reserved balance.

## Admin and Withdrawals

Apply every SQL migration in `supabase/migrations/` in filename order. Admins are managed in `public.site_admins`; no user or email is hardcoded in migrations. To grant one existing Supabase user access, resolve their email from `auth.users` using their UUID in a one-time SQL statement. This does not create an account or set a password; manage credentials in Supabase Auth.

Users can request an M-Pesa withdrawal from Real Wallet. The amount is reserved immediately and PayHero B2C is initiated automatically. The user or admin can check the PayHero status; successful payouts are recorded as paid, and confirmed failures refund the reserved balance. Real Wallet funds remain separate from the demo trading balance; demo trades are not real Deriv trades.

## Deploy to Vercel

Import this repository into Vercel with the repository root as the Root Directory and `main` as the Production Branch. Vercel detects Next.js automatically; the build command is `npm run build` and the install command is `npm install`.

Add `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYHERO_AUTH_TOKEN`, `PAYHERO_CHANNEL_ID` (numeric), `PAYHERO_C2B_PROVIDER=m-pesa`, and `PAYHERO_NETWORK_CODE=63902` in Vercel **Production** Environment Variables, then redeploy. New deposits always use PayHero; no provider-selection variable is required. Add the same values to Preview if preview deployments need account functionality. Never upload or commit `.env.production`; `.env.example` lists the supported variables. The service-role key and PayHero token must remain server-only.

In Supabase **Authentication → URL Configuration**, set the Site URL to the production deployment's domain. A successful build without Supabase variables can still deploy, but account form submissions and username login lookup will not work.

## Run Locally

```bash
npm install
npm run dev
```

The app is available at `http://localhost:3000`.

## Account and Trading Model

New site accounts receive a virtual USD 10,000 demo account. Users can also select Real Wallet to fund simulated trades from their deposited USD balance; stakes are reserved at placement and simulated payouts return to Real Wallet. These trades use public market quotes and are recorded in the user's Supabase-backed paper-trade history. The Deriv real account is a placeholder and remains unavailable until a regulated funding and execution provider is integrated. Real Wallet funds do not change the Deriv balance and cannot place real trades.

Demo trades use the editable duration selected for that trade (minimum 15 seconds); tick-duration contracts are not offered. Each trade stores its own `duration_seconds` and expiry in Supabase, so changing the duration for a later trade does not alter existing trades. At settlement, a winning trade credits the quoted gross payout (including the returned stake); a losing trade receives no payout and its stake remains deducted.

Deriv's public WebSocket is used for market symbols, quotes, and chart data only. No Deriv App ID, API token, or OAuth redirect URI is required for site login.

## Production Build

```bash
npm run build
npm start
```
