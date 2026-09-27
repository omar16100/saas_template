# C4 Model

## Context

```
[ User ] --HTTPS--> [ Cloudflare Edge (Pages/Workers) ] --> [ Next.js on OpenNext Worker ]
                                                                  |
                                                                  v
                       +----------------+  +----+  +----+  +------+-------+
                       | D1 (users,     |  | KV |  | R2 |  | Queues +     |
                       | billing, app)  |  |cache| |files|  | DLQ          |
                       +----------------+  +----+  +----+  +--------------+
                                                                  |
                        +------------+  +--------+  +-----------+ v
                        | Stripe API |  | Resend |  | PostHog   |
                        | (hosted    |  | (email)|  | / GA4     |
                        | checkout)  |  +--------+  +-----------+
                        +------------+
```

## Containers
- **web (Worker)**: Next.js (marketing SSG/ISR, app SSR, API routes)
- **Logpush** (Cloudflare-managed, configured during setup, not code in this repo): ships Worker logs to Axiom
- **cron/consumer** (not implemented yet): would process the Queue for deletion purge and export jobs; today `/api/account/delete` only enqueues

## Components
- `lib/auth.ts`: Better Auth. `getAuth()` builds the instance per call because the D1 binding only exists inside a request (`getCloudflareContext`); nothing touches it at module load, so `next build` can evaluate route modules. Passkeys come from `@better-auth/passkey`.
- `lib/stripe.ts` + `/api/stripe/*`: billing. `subscriptionCurrentPeriodEnd()` reads the period from the first subscription item (Stripe API 2025-03-31.basil and later). The client pins `apiVersion` to the version the installed stripe-node is typed for (`2026-08-26.dahlia` with stripe 22.6). Checkout copies `userId` into `subscription_data.metadata` (the webhook reads it from the Subscription) and pins `billing_mode: classic`, so portal cancellations keep setting `cancel_at_period_end`.
- `lib/logger.ts`: JSON log lines. `describeError()` drops bound query parameters from drizzle `DrizzleQueryError`s; Better Auth logs go through `logBetterAuthEvent()` for the same reason. `/api/auth/*` is served by `handleAuthRequest()` (lib/auth.ts), which catches errors Better Auth rethrows (`onAPIError.throw`) and logs them the same way.
- `db/repo/*` — repository boundary (swap D1 → Postgres/Turso without touching domain code)
- `lib/csp.ts` + `middleware.ts` — security headers
- `components/*` — UI + analytics + consent

## Build and delivery
- `pnpm build` runs `wrangler types` (generates the gitignored `cloudflare-env.d.ts`) then `next build`; `pnpm build:worker` runs `opennextjs-cloudflare build`, which calls `pnpm build` and bundles `.open-next/worker.js` + `.open-next/assets`.
- `.github/workflows/ci.yml` (PRs and pushes to `main`): install with the committed `pnpm-lock.yaml`, lint (ESLint flat config in `eslint.config.mjs`), typecheck (after `wrangler types`), unit tests, `drizzle-kit generate`, `pnpm build:worker`. On PRs a non-blocking Lighthouse run hits `next start` and uploads `.lighthouseci` as an artifact.
- `.github/workflows/deploy.yml`: `wrangler deploy --env preview` on PRs and `--env production` on pushes to `main`, only when secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set; otherwise the deploy job is skipped. Each run builds with the `NEXT_PUBLIC_*` variables of the matching GitHub environment (`preview` / `production`), since Next.js inlines them at build time.
- The landing page at omar16100.github.io/saas_template is served by GitHub Pages from the `gh-pages` branch and is independent of both workflows.
- Dependency updates: Dependabot (`.github/dependabot.yml`), npm and GitHub Actions, weekly. eslint majors are ignored until eslint-config-next supports them.
