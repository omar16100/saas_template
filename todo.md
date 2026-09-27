# todo

## post-scaffold
- [ ] `pnpm install` and resolve any peer dep warnings
- [ ] `wrangler d1 create saas_db` (preview + production) and paste IDs into wrangler.toml
- [ ] `wrangler kv namespace create CACHE` (preview + production)
- [ ] `wrangler r2 bucket create saas-uploads` (preview + production)
- [ ] `wrangler queues create saas-jobs` and `saas-jobs-dlq`
- [ ] Generate `BETTER_AUTH_SECRET`: `openssl rand -base64 32`
- [ ] Create Stripe products + prices, paste IDs
- [ ] Set up Stripe webhook endpoint, paste signing secret
- [ ] Add domain to CF, set up DNS, enable Email Routing for inbound
- [ ] Verify Resend domain (DKIM/SPF)
- [ ] Create Turnstile site + paste keys
- [ ] Set up Axiom dataset + token
- [ ] Configure Logpush job (Workers logs → Axiom)
- [ ] Add GSC + Bing verification meta tags
- [ ] Generate IndexNow key file at /.well-known/
- [ ] PostHog project + key
- [ ] GA4 property + measurement ID

## extensions (deferred)
- [ ] Multi-tenancy / orgs (see ADR)
- [ ] i18n + hreflang
- [ ] Storybook + separate UI package
- [ ] Unlighthouse cron
- [ ] Newsletter (Resend Broadcasts)
- [ ] Status page

## ci + dependency maintenance (27 Sep 2026, plan: docs/27092026_ci_and_deps_plan.md)
- [x] CI: drop pnpm `version` input, commit pnpm-lock.yaml, ESLint flat config, `drizzle-kit generate --config`, mandatory `pnpm build:worker`, Lighthouse non-blocking against `next start`
- [x] `pnpm build` is `next build` (was recursive `opennextjs-cloudflare build`); `build:worker` added
- [x] typecheck runs `wrangler types` first; passkeys from `@better-auth/passkey`; `requestPasswordReset`
- [x] Stripe `current_period_end` read from subscription items (+ unit test)
- [x] Better Auth built per request via `getAuth()` (+ unit test that import does not touch the CF context)
- [x] deploy.yml skips cleanly without the Cloudflare secrets; when enabled it builds per GitHub environment (`preview` / `production`) with that environment's `NEXT_PUBLIC_*` vars and fails if `NEXT_PUBLIC_APP_URL` is missing
- [x] `NEXT_PUBLIC_IS_PREVIEW="false"` no longer parses as true (+ unit test)
- [ ] canonical: root layout sets `/` for every page without an override (pricing, blog index, auth pages)
- [x] renovate.json removed (Dependabot only); eslint majors ignored
- [x] drop unused react-hook-form + @hookform/resolvers (supersedes Dependabot #5); eslint 10 (#4) closed
- [x] actions/checkout 7 (#9), actions/setup-node 7 (#11, replaced #1) and pnpm/action-setup 6 (#2, no `version:` input) merged
- [x] zod 4.6 (supersedes Dependabot #7 / #15): lib/env.ts on z.url(), z.email(), z.flattenError()
- [x] drizzle-kit 0.31.11 + drizzle-orm 0.45.3 (supersedes Dependabot #6 / #18); index definitions on the array form; generated SQL unchanged; Better Auth logs redact DrizzleQueryError params
- [ ] `recordStripeEventAndApply` treats every insert failure as a duplicate (swallows D1 outages)
- [x] stripe 22.6 (supersedes Dependabot #8 / #17): apiVersion pinned to the SDK's 2026-08-26.dahlia without a cast; checkout sets subscription_data.metadata.userId and billing_mode classic (+ tests)
- [ ] billing: pricing CTA reads NEXT_PUBLIC_STRIPE_PRICE_* but .env.example defines STRIPE_PRICE_*
- [ ] billing: dashboard "Manage billing" form gets JSON `{ url }` back instead of a redirect
- [ ] billing: webhook records the event before apply(), so a failed apply is never retried; upserts do not guard against out-of-order events
- [x] Dependabot PRs opened during this sweep: web-vitals 6 (#12) merged (only onCLS/onINP/onLCP/onFCP/onTTFB used); vitest 4 (#13) superseded by #23
- [x] reconcile db/schema/auth.ts with better-auth 1.7 plugin tables (twoFactor, passkey.aaguid), see the auth schema section below
- [x] upgrade wrangler 3 -> 4 (OpenNext peer requirement): wrangler 4.141.0; `@cloudflare/workers-types` dropped for the runtime types `wrangler types` now generates
- [x] security alerts (32 open on 27 Sep 2026, 0 after #23): vitest 4.1.11 + vite 8.3.1, happy-dom 20.14.5, wrangler 4 (clears undici, ws, sharp and esbuild 0.17 from wrangler 3 / miniflare 3), @react-email/components 0.0.36 (prismjs 1.30), `pnpm.overrides` `@esbuild-kit/core-utils>esbuild` ^0.25.4 (drizzle-kit 0.31.11 has no fix); email template render tests added
- [ ] migrate off deprecated `@react-email/components` (components moved into `react-email` 6)
- [x] `db:migrate:preview` targets `saas_db_preview` (was `saas_db`, not in the preview env); backup runbook R2 upload passes `--remote` (wrangler 4 defaults to local)
- [ ] drop the `@esbuild-kit/core-utils>esbuild` override when drizzle-kit no longer depends on `@esbuild-kit/esm-loader`
- [ ] turnstile widget render after async script load

## auth schema (27 Sep 2026, plan: docs/27092026_auth_schema_plan.md)
- [x] guard test `tests/unit/auth-schema.test.ts`: real `getAuth()` config through Better Auth's own schema check, plus columns, types, unique, indexes and foreign keys from `getAuthTables()`
- [x] `db/schema/auth.ts`: `twoFactor` table (`two_factor`, unique `user_id`), `user.twoFactorEnabled`, `passkey.aaguid`, `passkey.credentialID` property on the existing `credential_id` column, plugin indexes; additive only
- [x] commit `db/migrations/0000_initial.sql`; CI fails when `pnpm db:generate` writes anything
- [x] `.dev.vars` gitignored
- [x] end to end on the built Worker + local D1: sign-up, sign-in, get-session, sign-out, passkey register + sign-in, 2FA enable + sign-in with a backup code (40/40), and on a D1 upgraded from the old schema
- [ ] Better Auth rate limiter cannot see the client IP locally (shared bucket per path); check `cf-connecting-ip` via `advanced.ipAddress.ipAddressHeaders` with the rate-limit work
