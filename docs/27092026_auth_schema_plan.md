# Auth schema reconciliation plan (27 Sep 2026)

## Goal
Make `db/schema/auth.ts` hold everything the enabled Better Auth 1.7 plugins write, so auth requests stop failing, commit the migration that creates it, and add a guard so the schema cannot drift from the plugins again.

## Findings
- Better Auth 1.7 validates the Drizzle schema against the configured plugins before every auth request (`advanced.database.validateSchema` defaults to on) and fails the request on any mismatch. Against `main` every `/api/auth/*` request returned 500 (`auth_request_failed`, `Drizzle schema mismatch`), including `get-session` and `sign-up/email`.
- The check reads the Drizzle schema object, keyed by export name and column property name, not the SQL names. Its findings on `main`:
  - missing table `twoFactor` (two-factor plugin)
  - missing column `user.twoFactorEnabled` (two-factor plugin)
  - missing column `passkey.aaguid` (passkey plugin)
  - missing column `passkey.credentialID`, plus `passkey.credentialId` flagged as a required column Better Auth never writes (the property was spelled `credentialId`)
- `lib/auth.ts` enables `passkey()` (`@better-auth/passkey`), `twoFactor()` and `magicLink()`; email and password is on; Google is optional. Magic link and Google add no tables. Expected tables were read from the installed packages with `getAuthTables()` and with the Better Auth CLI at the installed version (`pnpm dlx auth@1.7.6 generate`, drizzle adapter, sqlite provider). As of 27 Sep 2026 `@better-auth/cli` has no 1.7 release on npm (latest 1.4.21); the 1.7 CLI is published as `auth`.
- Joins are off by default (`advanced.database.joins`), so the adapter never needs Drizzle `relations`; the CLI output includes them but they are not required.
- `db/migrations/` was not committed because an initial migration would have baked in the broken schema (see docs/27092026_ci_and_deps_plan.md). `wrangler.toml` points every D1 binding at `db/migrations` and the README runs `wrangler d1 migrations apply`, so the repo expects committed migrations.

## Plan
1. Failing test first: `tests/unit/auth-schema.test.ts` builds the real Better Auth instance with `getAuth()` (Cloudflare context mocked) and runs Better Auth's own schema check (`$context.explicitSchemaCheck`, typed on the 1.7 `AuthContext`; the test fails loudly if it disappears), then compares `getAuthTables(options)` with the Drizzle tables for columns, types, unique flags, indexes, foreign keys, and optional fields that must accept a missing value (Better Auth's check does not cover nullability of fields it knows).
2. Fix `db/schema/auth.ts` with additive changes only.
3. Commit the initial migration `db/migrations/0000_initial.sql` and make CI fail when `pnpm db:generate` produces anything new.
4. End to end against the built Worker and a local D1.

## Decisions
- Additive only, checked by generating the step from the `main` schema with drizzle-kit: `CREATE TABLE two_factor`, `ALTER TABLE passkey ADD aaguid`, `ALTER TABLE user ADD two_factor_enabled DEFAULT false`, and `CREATE INDEX` / `CREATE UNIQUE INDEX` statements. No table rebuild, no dropped or renamed SQL column. `credentialId` becomes the property `credentialID` on the same `credential_id` column, so the rename needs no SQL.
- Where the CLI output and the existing schema differ and matching would need a table rebuild or would change stored data, the existing schema stays:
  - timestamps stay `mode: "timestamp"` (seconds), the convention of every table here; the CLI emits `timestamp_ms`, and switching would misread stored values.
  - `user.name` and `passkey.device_type` stay nullable (the CLI makes them `NOT NULL`); Better Auth always writes both.
  - `created_at` / `updated_at` get no SQL default (Better Auth always writes them).
  - `passkey.created_at` stays `NOT NULL` although the plugin marks `createdAt` optional; it gets a Drizzle-side `$defaultFn(() => new Date())` (no SQL change) so an insert that leaves it out still works.
- `passkey.credential_id` keeps its unique index and `two_factor.user_id` is unique, where the CLI only indexes them. WebAuthn credential IDs are unique per relying party, and the two-factor plugin keeps one row per user (enable looks the row up by `userId`, then updates or inserts), so a unique index enforces what the plugin already assumes and stops two concurrent enables from leaving two rows. Trade-off (review finding): the plugin's lookup-then-insert is not atomic, so when two first-time enables for the same user race, one gets a 500 from the unique violation (logged as `auth_request_failed` without bound values) and one valid row remains; a retry succeeds. A plain index would instead leave two rows and an arbitrary one used for verification.
- Other indexes the plugins ask for are added with the repo's `<table>_<column>_idx` names: `session_user_idx`, `account_user_idx`, `verification_identifier_idx`, `passkey_user_idx`, `two_factor_secret_idx`.
- The SQL table is `two_factor` (snake_case like every other table); the export is `twoFactor`, the model name Better Auth looks up.
- `db/migrations` is committed. CI runs `pnpm db:generate` and fails if it writes anything under `db/migrations`. The migration was generated by `pnpm db:generate --name initial`.
- `.dev.vars` (and `.dev.vars.*`) are gitignored: `wrangler dev` and `pnpm preview` read local secrets from it.

## End-to-end test (27 Sep 2026)
Setup, from a clean checkout of the branch (Node 22, pnpm 9.15.0, wrangler 4.141.0):
```bash
NEXT_PUBLIC_APP_URL=http://localhost:8799 pnpm build:worker
printf 'BETTER_AUTH_SECRET=%s\n' "$(openssl rand -base64 36)" > .dev.vars   # throwaway, gitignored
pnpm db:migrate:local          # wrangler d1 migrations apply saas_db --local: 0000_initial.sql, 29 commands
pnpm preview --port 8799       # opennextjs-cloudflare preview (wrangler dev, local D1)
```
The requests ran from a Node script with a cookie jar, `Origin: http://localhost:8799`, and 3.5 s between requests (Better Auth's built-in rate limit allows 3 sign-in or two-factor requests per 10 s). Outside preview mode sign-up requires email verification, and Resend is not configured locally, so the verification email fails to send (logged, sign-up still 200). The script stands in for the email link by minting the same HS256 token Better Auth puts in it, with the throwaway secret. Passkeys used a software authenticator (ES256 key, `none` attestation, random AAGUID, rpID `localhost`).

| Step | Request | Status |
|---|---|---|
| no cookie | GET /api/auth/get-session | 200, `null` |
| sign up | POST /api/auth/sign-up/email | 200, `twoFactorEnabled: false` |
| sign in, email unverified | POST /api/auth/sign-in/email | 403 `EMAIL_NOT_VERIFIED` (expected) |
| email link | GET /api/auth/verify-email?token=... | 200 |
| sign in | POST /api/auth/sign-in/email | 200, `saas.session_token` set |
| session | GET /api/auth/get-session | 200, user and session |
| passkey options | GET /api/auth/passkey/generate-register-options | 200, `rp.id` localhost + challenge |
| passkey register | POST /api/auth/passkey/verify-registration | 200, row with `credentialID` and `aaguid` |
| passkey list | GET /api/auth/passkey/list-user-passkeys | 200, 1 passkey |
| 2FA enable | POST /api/auth/two-factor/enable | 200, `otpauth://totp/...` URI + backup codes |
| 2FA confirm | POST /api/auth/two-factor/verify-totp | 200 |
| session | GET /api/auth/get-session | 200, `twoFactorEnabled: true` |
| sign out | POST /api/auth/sign-out | 200 |
| session | GET /api/auth/get-session | 200, `null` |
| sign in with 2FA | POST /api/auth/sign-in/email | 200, `twoFactorRedirect: true`, no session cookie |
| second factor | POST /api/auth/two-factor/verify-backup-code | 200 |
| session | GET /api/auth/get-session | 200, user |
| sign out | POST /api/auth/sign-out | 200 |
| passkey options | GET /api/auth/passkey/generate-authenticate-options | 200 |
| passkey sign in | POST /api/auth/passkey/verify-authentication | 200, same user |
| session | GET /api/auth/get-session | 200, user |
| sign out | POST /api/auth/sign-out | 200 |

40 of 40 status and response checks passed. Local D1 afterwards: `user.two_factor_enabled = 1`, one `passkey` row (`aaguid` set, `counter` 1, `device_type` `singleDevice`), one `two_factor` row (`verified` 1), no sessions left. Worker log: one error, `Failed to run background task: RESEND_API_KEY missing` (the verification email), and one warning that Better Auth's rate limiter could not determine a client IP.

Same build and requests against the `main` schema (its generated SQL applied to a fresh local D1): `GET /` 200, `GET /api/auth/get-session` 500, `POST /api/auth/sign-up/email` 500, `POST /api/auth/sign-in/email` 500, `GET /api/auth/passkey/generate-authenticate-options` 500, each logged as `Drizzle schema mismatch`.

Upgrade path: on that `main`-schema D1, with a pre-existing user and subscription row, the additive step (drizzle-kit output from the `main` snapshot to this schema) applied with `wrangler d1 execute --local --file`; the fixed Worker then passed the same 40 checks, and the old user row was intact with `two_factor_enabled = 0` and its subscription still `active`.

## Status
- [x] Guard test red on `main` (Better Auth's check listed exactly the four findings above), green after the fix. Mutations caught: a column type change, a dropped foreign key or unique, a dropped index, `session.token` not unique, `two_factor.locked_until` made `NOT NULL`.
- [x] Codex review round 1: no blocker or major. Applied: nullability rule in the guard (it found `passkey.created_at`, fixed with a Drizzle-side default), migration warning next to the README and setup commands. Documented, not changed: the concurrent 2FA enable 500 (see Decisions).
- [x] `db/schema/auth.ts` fixed; `db/migrations/0000_initial.sql` committed; CI checks migrations are in sync (verified locally that a schema change without a migration fails the check).
- [x] lint, typecheck, 37 unit tests (32 before, 5 new), `pnpm db:generate` (no changes), `pnpm build:worker` pass locally.
- [x] End to end as above, fresh and upgraded D1.

## Deviations
- The E2E ran on port 8799 because 8787, wrangler's default, was taken on the test machine.
- Email verification was completed with a minted token rather than a delivered email (no Resend key locally).

## Follow-ups for the owner (not done here)
- Deployments that already applied migrations they generated from the earlier schema: do not apply `0000_initial.sql` on top (it creates every table). Keep your own migration history and run `pnpm db:generate`; the change is the additive SQL listed under Decisions.
- Better Auth's built-in rate limiter logged locally that it cannot determine the client IP and falls back to one shared bucket per path. On Cloudflare the client IP is in `cf-connecting-ip`; setting `advanced.ipAddress.ipAddressHeaders` is untested and left with the other rate-limiting work.
- Turnstile server check, the `lib/rate-limit.ts` wiring, webhook idempotency and billing gaps are unchanged (README Known gaps).
