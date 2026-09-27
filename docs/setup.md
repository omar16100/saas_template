# Setup

## 1. Prereqs
- Node 22 (see `.nvmrc`)
- pnpm 9
- Cloudflare account + `wrangler login`
- Domain on Cloudflare

## 2. Install
```bash
pnpm install
cp .env.example .env.local
```

## 3. Create Cloudflare bindings
```bash
wrangler d1 create saas_db
wrangler d1 create saas_db_preview
wrangler kv namespace create CACHE
wrangler kv namespace create CACHE --preview
wrangler r2 bucket create saas-uploads
wrangler r2 bucket create saas-uploads-preview
wrangler r2 bucket create saas-next-cache
wrangler r2 bucket create saas-next-cache-preview
wrangler queues create saas-jobs
wrangler queues create saas-jobs-dlq
wrangler queues create saas-jobs-preview
wrangler queues create saas-jobs-preview-dlq
```
Paste IDs into `wrangler.toml`.

## 4. Secrets (production & preview)
```bash
wrangler secret put BETTER_AUTH_SECRET --env production
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put STRIPE_WEBHOOK_SECRET --env production
wrangler secret put RESEND_API_KEY --env production
wrangler secret put TURNSTILE_SECRET_KEY --env production
# repeat for --env preview with TEST keys
```

## 5. DB migrations
```bash
pnpm db:generate          # writes SQL to db/migrations (config: db/drizzle.config.ts)
pnpm db:migrate:local     # local
pnpm db:migrate:preview   # preview
pnpm db:migrate:prod      # production
```

## 6. Dev
```bash
pnpm dev
pnpm cf-typegen   # regenerate cloudflare-env.d.ts after editing wrangler.toml (pnpm typecheck does this too)
pnpm build:worker # production build: next build + OpenNext worker bundle
```

## 7. Deploy
```bash
pnpm deploy:preview
pnpm run deploy   # `pnpm deploy` is a pnpm builtin, so use `run`
```

Or let `.github/workflows/deploy.yml` do it: add repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and create GitHub environments `preview` and `production` with at least the variable `NEXT_PUBLIC_APP_URL` (plus any other `NEXT_PUBLIC_*` the build needs; they are inlined at build time). Without the secrets the workflow skips the deploy.

## 8. Post-deploy
- Add domain + DNS in CF
- Enable CF Email Routing for inbound forward
- Verify Resend domain (DKIM/SPF/DMARC)
- Point Stripe webhook at `/api/stripe/webhook` and set the endpoint's API version to the one pinned in `lib/stripe.ts` (currently `2026-08-26.dahlia`, the version stripe-node 22.6 is typed for). Webhook payloads follow the endpoint's version, not the SDK's.
- Add GSC + Bing properties, paste verification codes
- Generate `INDEXNOW_KEY` and serve at `/{key}.txt`
- Configure Logpush → Axiom
