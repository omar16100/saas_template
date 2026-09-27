# SaaS Template

[![Website](https://img.shields.io/badge/website-omar16100.github.io-f38020)](https://omar16100.github.io/saas_template/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Website:** https://omar16100.github.io/saas_template/

Opinionated, Cloudflare-first SaaS starter. Clone, rename, deploy.

**Stack:** Next.js 16 (App Router) on Cloudflare Workers via `@opennextjs/cloudflare` · D1 + Drizzle · Better Auth (passkeys, MFA, OAuth, magic links) · Stripe hosted Checkout + Portal · Resend + CF Email Routing · shadcn/ui + Tailwind · GA4 + PostHog (consent-gated) · Turnstile · Axiom via Logpush · Vitest + Playwright · GitHub Actions CI + opt-in Cloudflare deploy.

**Rendering:** Marketing + blog → SSG/ISR (edge-cached, best SEO). Auth + dashboard → SSR. API routes → Workers.

---

## Why this template

- **One platform.** Every runtime dependency (compute, DB, files, cache, queues, email routing) lives on Cloudflare. One bill, one dashboard, one set of credentials.
- **SEO-first.** Static marketing + blog, dynamic sitemap, JSON-LD, IndexNow, `llms.txt`, preview auto-`noindex`, Lighthouse report on every PR (non-blocking).
- **Secure by default.** Route-scoped CSP, strict security headers, D1-backed Stripe webhook idempotency, Better Auth with passkeys, Turnstile widget and D1 rate-limit helpers, account delete + data export (see [Known gaps](#known-gaps)).
- **Boring, swappable stack.** Repository layer (`db/repo/*`) isolates D1 so you can swap to Postgres/Turso later without touching domain code.
- **No monorepo tax.** Flat Next.js app. Promote to a workspace later only if you genuinely need to.

---

## Quick start

```bash
git clone https://github.com/omar16100/saas_template.git my-saas
cd my-saas
pnpm install
cp .env.example .env.local
# fill in BETTER_AUTH_SECRET at minimum: openssl rand -base64 32
pnpm dev
```

Visit `http://localhost:3000`.

The app boots with degraded features until you fill in credentials (auth needs the secret; Stripe/Resend/Turnstile each fail gracefully if unconfigured).

---

## Full setup

### 1. Prereqs
- Node 22 (see `.nvmrc`) · pnpm 9 · a Cloudflare account · `wrangler login`
- Domain added to Cloudflare (can be a subdomain); only required for deploy, not local dev

### 2. Install

```bash
pnpm install
cp .env.example .env.local
```

### 3. Local secret

```bash
# Generate a 32+ char secret for Better Auth
openssl rand -base64 32
# paste into .env.local → BETTER_AUTH_SECRET
```

### 4. Create Cloudflare bindings

```bash
# Databases
wrangler d1 create saas_db
wrangler d1 create saas_db_preview

# KV (cache)
wrangler kv namespace create CACHE
wrangler kv namespace create CACHE --preview

# R2 buckets (uploads + Next ISR cache, both envs)
wrangler r2 bucket create saas-uploads
wrangler r2 bucket create saas-uploads-preview
wrangler r2 bucket create saas-next-cache
wrangler r2 bucket create saas-next-cache-preview

# Queues (main + DLQ, both envs)
wrangler queues create saas-jobs
wrangler queues create saas-jobs-dlq
wrangler queues create saas-jobs-preview
wrangler queues create saas-jobs-preview-dlq
```

Paste the returned IDs into `wrangler.toml` wherever you see `REPLACE_ME`.

### 5. Secrets per environment

```bash
# Production
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
wrangler secret put RESEND_API_KEY --env production
wrangler secret put TURNSTILE_SECRET_KEY --env production

# Preview (repeat with TEST keys)
wrangler secret put BETTER_AUTH_SECRET --env preview
wrangler secret put STRIPE_SECRET_KEY --env preview
# ...etc
```

Public (`NEXT_PUBLIC_*`) vars are not secrets, so never `wrangler secret` them. `next build` inlines them, so they must be set where you build (`.env.local`, your shell, or the GitHub environment used by `deploy.yml`); the `[env.*.vars]` blocks in `wrangler.toml` only cover runtime reads.

### 6. Database

```bash
pnpm db:migrate:local    # apply db/migrations locally
pnpm db:migrate:preview  # apply to preview D1
pnpm db:migrate:prod     # apply to production D1
pnpm db:generate         # after editing db/schema: write the next migration, then commit it
```

If your D1 already has tables from migrations you generated before `0000_initial.sql` was committed, keep your own `db/migrations` history and run `pnpm db:generate` instead of applying it (see `docs/27092026_auth_schema_plan.md`).

`db/schema/auth.ts` must hold every table and field the enabled Better Auth plugins write: Better Auth checks it on every auth request and fails the request on a mismatch. `tests/unit/auth-schema.test.ts` runs the same check, so adding a plugin without its tables fails `pnpm test`.

### 7. Run

```bash
pnpm dev         # http://localhost:3000
pnpm build       # next build
pnpm build:worker # next build + OpenNext worker bundle (.open-next/)
pnpm preview     # run the built worker locally (after build:worker)
pnpm typecheck
pnpm lint
pnpm test        # vitest
pnpm test:e2e    # playwright
```

### 8. Deploy

```bash
pnpm deploy:preview   # wrangler deploy --env preview
pnpm run deploy       # wrangler deploy --env production (`pnpm deploy` is a pnpm builtin, so use `run`)
```

GitHub Actions can do this for you: `.github/workflows/deploy.yml` deploys a preview on every PR and production on merge to `main` once you add repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Create GitHub environments `preview` and `production`, each with at least the variable `NEXT_PUBLIC_APP_URL` plus any other `NEXT_PUBLIC_*` values your build needs; the workflow exports them before building and sets `NEXT_PUBLIC_IS_PREVIEW` itself. Without the secrets the deploy job is skipped and the workflow passes. Secrets are not passed to PRs from forks or Dependabot, so those PRs skip it too.

### 9. Post-deploy checklist

- [ ] Add your domain to CF and route `example.com/*` in `wrangler.toml`
- [ ] Enable **CF Email Routing** (inbound only: support@, hello@ → your inbox)
- [ ] Verify your sending domain in **Resend** (DKIM + SPF + DMARC)
- [ ] Register a **Stripe** webhook endpoint per environment → paste signing secret
- [ ] Create **Turnstile** site → paste keys
- [ ] Create **Axiom** dataset + token → set up Cloudflare Logpush job → Axiom
- [ ] Add site to **Google Search Console** and **Bing Webmaster Tools** → paste verification tokens
- [ ] Generate `INDEXNOW_KEY` → serve at `/{key}.txt` under `public/`
- [ ] Create **PostHog** project + **GA4** property → paste IDs

See `docs/setup.md` for verbose version and `todo.md` for the full one-time checklist.

---

## Environment variables

Full list in `.env.example`. Categorized in `docs/setup.md`. The minimum to boot locally: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_NAME`, `BETTER_AUTH_SECRET`.

---

## Project structure

```
app/
  (marketing)/     # SSG/ISR: landing, pricing, blog, legal
  (auth)/          # sign-in, sign-up, reset
  (app)/           # SSR, authed dashboard
  api/             # auth, stripe, indexnow, account, health
  sitemap.ts  robots.ts  feed.xml/
components/        # UI + consent + analytics + JSON-LD
content/blog/      # MDX posts
db/
  schema/          # Drizzle schema (auth, billing, app)
  repo/            # repository layer: D1 impl today, swappable
  migrations/      # SQL from `pnpm db:generate`, committed; CI fails if it is out of date
emails/            # react-email templates
lib/               # auth, db, stripe, resend, logger, csp, rate-limit, env
tests/             # unit (vitest) + e2e (playwright)
docs/              # index, c4model, setup, runbooks/, adr/
```

---

## What's included

- **Auth:** email+password, Google OAuth, magic links, passkeys, 2FA (Better Auth)
- **Billing:** Stripe hosted Checkout, Customer Portal, webhook with D1 idempotency, Stripe Tax
- **Email:** Resend outbound + react-email templates (welcome, verify, reset, magic link, deletion)
- **Bot / abuse:** Turnstile widget on sign-in/sign-up, D1 fixed-window rate limiter helper (both still to be wired into routes, see [Known gaps](#known-gaps))
- **Security:** route-scoped CSP (static for marketing = SSG-safe, nonce for app), HSTS, X-Frame-Options DENY, no-sniff, strict Referrer-Policy, Permissions-Policy
- **SEO:** dynamic sitemap, robots (preview `noindex`), RSS, JSON-LD (Organization / WebSite+SearchAction / BreadcrumbList / Article / FAQPage / SoftwareApplication), IndexNow endpoint, `llms.txt`, canonical URLs on blog posts and legal pages, consent-gated GA4 + PostHog, web-vitals → PostHog, Lighthouse report on PRs
- **Privacy:** consent banner gates analytics, account delete w/ 30-day grace (enqueued; consumer not included yet), account data export to R2
- **Ops:** structured JSON logging (ship to Axiom with Cloudflare Logpush, see `docs/setup.md`), CI (lint, typecheck, unit tests, migration generation, production build, non-blocking Lighthouse on PRs), opt-in deploy (preview per PR, prod on main), Dependabot
- **Docs:** C4 diagram, setup, runbooks (D1 escape hatch, backup/restore, Stripe isolation, passkey domain binding), ADR

## Known gaps

`.github/workflows/ci.yml` installs, lints, typechecks, tests and builds the template on every PR and push to `main`. As of 27 Sep 2026 these parts are scaffolded rather than wired end to end (tracked in `todo.md`):

- Turnstile: the widget renders on sign-in/sign-up, but no route calls `verifyTurnstile` in `lib/turnstile.ts`.
- Rate limiting: `lib/rate-limit.ts` exists, but no route calls it.
- Account deletion enqueues a purge job, but no queue consumer processes it.
- The root layout sets canonical `/`, so pages without their own `alternates.canonical` (pricing, blog index, auth pages) point search engines at the homepage.
- Billing: the pricing button reads `NEXT_PUBLIC_STRIPE_PRICE_*` while `.env.example` defines `STRIPE_PRICE_*`; the dashboard "Manage billing" form receives the portal URL as JSON instead of being redirected; the webhook records an event before applying it, so a failed apply is not retried.

## Intentionally not included

- Monorepo / Turborepo (flat app; promote only when needed)
- Multi-tenancy / orgs (single-user model; extension path in ADR)
- i18n / hreflang
- Storybook
- Status page
- Newsletter
- Custom ML/AI features

---

## Philosophy

Every dependency was picked to **reduce later regret, not to maximize current convenience**:

- Stripe *hosted* Checkout over embedded payment UI → card details are entered on Stripe's page, not yours, and CSP stays simple
- D1 *with a repo boundary* → cheap today, swappable when you outgrow D1's size limits
- Flat app *without* a monorepo → no scaffolding tax until you actually have multiple apps
- Better Auth *without* custom CSRF → one layer, not two that fight each other
- SSG for SEO pages *always* → crawlers see instant HTML, Google rewards you, cache misses never hit origin

---

## License

MIT, see `LICENSE`.

## Contributing

PRs welcome. Before submitting:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Keep the template opinionated: if a feature is "nice to have for some projects", put it in `docs/` as an extension, not in the main template.
