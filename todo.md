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
