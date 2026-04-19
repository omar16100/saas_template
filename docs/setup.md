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
pnpm db:generate
pnpm db:migrate:local     # local
pnpm db:migrate:preview   # preview
pnpm db:migrate:prod      # production
```

## 6. Dev
```bash
pnpm dev
```

## 7. Deploy
```bash
pnpm deploy:preview
pnpm deploy
```

## 8. Post-deploy
- Add domain + DNS in CF
- Enable CF Email Routing for inbound forward
- Verify Resend domain (DKIM/SPF/DMARC)
- Point Stripe webhook at `/api/stripe/webhook`
- Add GSC + Bing properties, paste verification codes
- Generate `INDEXNOW_KEY` and serve at `/{key}.txt`
- Configure Logpush → Axiom
