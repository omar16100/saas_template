# Passkey & Preview Domains

WebAuthn credentials are bound to `rpID` (Relying Party ID). The value **must exactly match** the browser's current origin.

## Implications
- A passkey registered at `example.com` **cannot** sign in at `pr-123.preview.example.com`.
- Cross-subdomain passkeys require `rpID = example.com` (apex) and all origins listed in `trustedOrigins`.

## Starter defaults
- `BETTER_AUTH_RP_ID` is per-env in `wrangler.toml`:
  - local: `localhost`
  - preview: `preview.example.com`
  - production: `example.com`
- Preview branches share the same `rpID` as `preview.example.com`, so they can share passkeys among themselves but not with prod.

## Recommended policy
- Users register passkeys only against production.
- On preview, fall back to email/password or magic link for QA.

## Migration
If you later want passkeys usable across `app.example.com` and `example.com`:
1. Set `rpID = example.com`.
2. Re-register users (old credentials invalid — there is no migration path).
