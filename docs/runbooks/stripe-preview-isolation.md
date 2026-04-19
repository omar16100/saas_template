# Stripe Preview Isolation

**Never** let preview deployments touch Stripe live mode.

## Required
- `STRIPE_SECRET_KEY` on `env.preview` = `sk_test_...`
- `STRIPE_SECRET_KEY` on `env.production` = `sk_live_...`
- Separate webhook endpoints in Stripe dashboard, one per environment
- Separate products/prices in test mode

## Verification checklist
- [ ] `wrangler secret list --env preview` shows test keys only
- [ ] `wrangler secret list --env production` shows live keys
- [ ] Stripe dashboard has exactly 2 webhook endpoints, each pointing at the correct CF route
- [ ] Preview checkout URLs open `checkout.stripe.com/c/pay/cs_test_*` (not `cs_live_*`)

## Automated check
`lib/env.ts` refuses to boot if `STRIPE_SECRET_KEY` starts with `sk_live_` while `NEXT_PUBLIC_IS_PREVIEW=true`. Add a runtime assertion if needed.
