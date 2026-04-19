# SaaS Template

Cloudflare-first SaaS starter. Clone, rename, deploy.

## Stack
- Next.js 16 (App Router) on Cloudflare Workers via `@opennextjs/cloudflare`
- D1 + Drizzle (swappable repo layer)
- Better Auth (passkeys, MFA, OAuth, magic links)
- Stripe hosted Checkout + Portal
- Resend (outbound) + CF Email Routing (inbound)
- shadcn/ui + Tailwind
- GA4 + PostHog + CF Web Analytics (consent-gated)
- Axiom (logs via Logpush + Tail Worker)
- Turnstile + CF Rate Limiting

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm cf-typegen
pnpm db:generate
pnpm db:migrate:local
pnpm dev
```

## Deploy

```bash
# Preview (Stripe test mode, separate D1)
pnpm deploy:preview

# Production
pnpm deploy
```

See `docs/setup.md` for full setup, including binding creation and secret management.

## Rendering strategy
- Marketing + blog: SSG/ISR (edge-cached, best SEO)
- Auth + dashboard: SSR
- API routes: Workers handlers

## Docs
See `docs/index.md`.
