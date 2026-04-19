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
- **tail-worker**: forwards logs to Axiom
- **cron/consumer**: processes Queue for deletion purge, export jobs

## Components
- `lib/auth.ts` — Better Auth
- `lib/stripe.ts` + `/api/stripe/*` — billing
- `db/repo/*` — repository boundary (swap D1 → Postgres/Turso without touching domain code)
- `lib/csp.ts` + `middleware.ts` — security headers
- `components/*` — UI + analytics + consent
