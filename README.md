# SaaS Template

[![Website](https://img.shields.io/badge/website-omar16100.github.io-f38020)](https://omar16100.github.io/saas_template/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Website:** https://omar16100.github.io/saas_template/

Opinionated, Cloudflare-first SaaS starter. Clone, rename, deploy.

**Stack:** Next.js 16 (App Router) on Cloudflare Workers via `@opennextjs/cloudflare` · D1 + Drizzle · Better Auth (passkeys, MFA, OAuth, magic links) · Stripe hosted Checkout + Portal · Resend + CF Email Routing · shadcn/ui + Tailwind · GA4 + PostHog + CF Web Analytics (consent-gated) · Turnstile · Axiom via Logpush · Vitest + Playwright · GitHub Actions CI/CD.

**Rendering:** Marketing + blog → SSG/ISR (edge-cached, best SEO). Auth + dashboard → SSR. API routes → Workers.

---

## Why this template

- **One platform.** Every runtime dependency (compute, DB, files, cache, queues, email routing) lives on Cloudflare. One bill, one dashboard, one set of credentials.
- **SEO-first.** Static marketing + blog, dynamic sitemap, JSON-LD, IndexNow, `llms.txt`, preview auto-`noindex`, Lighthouse CI on every PR.
- **Secure by default.** Route-scoped CSP, strict security headers, D1-backed Stripe webhook idempotency, Better Auth with passkeys, Turnstile on auth, CF Rate Limiting, account delete + data export.
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
- Domain added to Cloudflare (can be a subdomain) — only required for deploy, not local dev

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

Public (`NEXT_PUBLIC_*`) vars go in `[env.*.vars]` blocks in `wrangler.toml`, not `wrangler secret`.

### 6. Database

```bash
pnpm db:generate         # generate migration SQL from schema
pnpm db:migrate:local    # apply locally
pnpm db:migrate:preview  # apply to preview D1
pnpm db:migrate:prod     # apply to production D1
```

### 7. Run

```bash
pnpm dev         # http://localhost:3000
pnpm build       # opennext build
pnpm preview     # run the built worker locally
pnpm typecheck
pnpm lint
pnpm test        # vitest
pnpm test:e2e    # playwright
```

### 8. Deploy

```bash
pnpm deploy:preview   # wrangler deploy --env preview
pnpm deploy           # wrangler deploy --env production
```

GitHub Actions does this automatically: preview on every PR, production on merge to `main`. Add repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

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
  (marketing)/     # SSG/ISR — landing, pricing, blog, legal
  (auth)/          # sign-in, sign-up, reset
  (app)/           # SSR, authed dashboard
  api/             # auth, stripe, indexnow, account, health
  sitemap.ts  robots.ts  feed.xml/
components/        # UI + consent + analytics + JSON-LD
content/blog/      # MDX posts
db/
  schema/          # Drizzle schema (auth, billing, app)
  repo/            # repository layer — D1 impl today, swappable
  migrations/
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
- **Bot / abuse:** Turnstile on auth, D1 fixed-window rate limiter
- **Security:** route-scoped CSP (static for marketing = SSG-safe, nonce for app), HSTS, X-Frame-Options DENY, no-sniff, strict Referrer-Policy, Permissions-Policy
- **SEO:** dynamic sitemap, robots (preview `noindex`), RSS, JSON-LD (Organization / WebSite+SearchAction / BreadcrumbList / Article / FAQPage / SoftwareApplication), IndexNow endpoint, `llms.txt`, per-route canonical, consent-gated GA4 + PostHog, web-vitals → PostHog, Lighthouse CI on PRs
- **Privacy:** consent banner gates analytics, account delete w/ 30-day grace via Queue, account data export to R2
- **Ops:** structured JSON logging, Tail Worker to Axiom via Logpush, CI (lint/typecheck/test/Lighthouse), deploy (preview per PR, prod on main), Dependabot + Renovate
- **Docs:** C4 diagram, setup, runbooks (D1 escape hatch, backup/restore, Stripe isolation, passkey domain binding), ADR

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

- Stripe *hosted* Checkout over embedded payment UI → keeps PCI scope zero and CSP simple
- D1 *with a repo boundary* → cheap today, swappable when you outgrow 10 GB
- Flat app *without* a monorepo → no scaffolding tax until you actually have multiple apps
- Better Auth *without* custom CSRF → one layer, not two that fight each other
- SSG for SEO pages *always* → crawlers see instant HTML, Google rewards you, cache misses never hit origin

---

## License

MIT — see `LICENSE`.

## Contributing

PRs welcome. Before submitting:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Keep the template opinionated: if a feature is "nice to have for some projects", put it in `docs/` as an extension, not in the main template.
