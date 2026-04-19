# ADR-001: Cloudflare-first, flat repo, no monorepo

Date: 2026-04-19
Status: Accepted

## Context
Template for many future SaaS products. Needs to be fast to clone, cheap to run, SEO-optimal, deployable in one command.

## Decision
- **Cloudflare** for everything: Workers (compute), D1 (DB), R2 (files), KV (cache), Queues (jobs).
- **Flat Next.js app**, no pnpm workspaces, no Turborepo — avoids scaffolding tax for the 99% case where one app is enough.
- **Repository layer** (`db/repo/*`) isolates D1 so growth doesn't force a rewrite.
- **Stripe hosted** Checkout + Portal (no embedded UI → simpler CSP, fewer PCI questions).
- **Better Auth** over Auth.js/Lucia — first-class CF + passkeys + MFA.
- **SSG/ISR for marketing & blog**, SSR for app — best SEO, lowest TTFB.

## Consequences
- Vendor lock-in to Cloudflare is real. Mitigated by repo boundary and Next.js's portability.
- Multi-app needs (admin + user web + marketing) require promoting to a monorepo later. Acceptable cost when the need is real.
- D1 limits require the documented escape hatch for high-volume tables.

## Alternatives considered
- Vercel + Neon: better DX for ISR, but pays Vercel tax + separate DB vendor.
- AWS (Lambda + RDS + Cognito): too much yak-shaving for a starter.
- Supabase all-in: solid, but locks auth + DB + storage to one vendor with weaker edge story.
