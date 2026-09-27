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
- [ ] Dependabot: drizzle-kit 0.31 + drizzle-orm (#6), stripe 22 (#8 / #17)
- [ ] reconcile db/schema/auth.ts with better-auth 1.7 plugin tables (twoFactor, passkey.aaguid)
- [ ] upgrade wrangler 3 -> 4 (OpenNext peer requirement)
- [ ] turnstile widget render after async script load

