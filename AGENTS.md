# AGENTS.md

Instructions for AI coding assistants (Claude, Cursor, Copilot, Aider, Codex) working in this repo.

**Read this file before every non-trivial change.** The three disciplines below are non-negotiable.

---

## 1. Test-Driven Development (TDD) — priority #1

Write the test **first**. No exceptions for production code.

### Loop

1. **Red** — write a failing test that describes the smallest behavioral delta.
2. **Green** — write the simplest implementation that makes it pass. Ugly is fine.
3. **Refactor** — clean up with tests green. Re-run after every change.
4. **Commit** when all tests pass. Commits should be small enough that a reviewer understands the delta in under 30 seconds.

### Rules

- **No code without a failing test first.** If you cannot write the test, you do not yet understand the requirement.
- **One behavior per test.** Tests assert a single observable outcome. Multi-assertion tests are acceptable only when they describe one coherent behavior (e.g., the same webhook call updates both a user and a subscription).
- **Test names describe behavior, not implementation.** `rejects_duplicate_stripe_event`, not `test_insert_conflict`.
- **Unit tests are fast.** < 50ms per test. If you need the network or a real DB, it belongs in `tests/e2e/`, not `tests/unit/`.
- **Don't mock what you own.** Mock Stripe, Resend, R2. Don't mock `db/repo/*` or `lib/*` — test the real thing against an in-memory or fake fixture.
- **Contract tests at boundaries.** Every new `db/repo/*` method gets a contract test that any implementation (D1, Postgres, in-memory) must pass. See `tests/unit/stripe-idempotency.test.ts` for the pattern.
- **E2E covers the golden path only.** One test per critical user flow: sign up, sign in, checkout, webhook, account delete. Don't retest what unit tests already cover.
- **Coverage is an output, not a target.** Aim for 100% of business logic. Don't write tests to chase a number.

### What "working on this codebase" means

```
# before any change
pnpm test         # must be green

# red
# add failing test to tests/unit/... or tests/e2e/...
pnpm test         # must show the new test failing

# green
# minimal impl

# refactor
pnpm test         # still green
pnpm typecheck
pnpm lint

# commit
```

### CI enforcement

`.github/workflows/ci.yml` runs `lint`, `typecheck`, `test`, migration generation and the production build (`pnpm build:worker`) on every PR and push to `main`. Lighthouse runs on PRs as a non-blocking report. Do not merge on red CI. Never bypass with `--no-verify` or `[skip ci]`.

---

## 2. Security — OWASP Top 10 checklist

Every PR must pass this review. Paste the checklist into the PR body and tick each item.

### A01: Broken Access Control
- [ ] Every `app/api/**` route calls `auth.api.getSession()` unless explicitly public (health, stripe webhook, indexnow)
- [ ] Authorization check (not just authentication): does this user own this resource?
- [ ] `app/(app)/layout.tsx` pattern used for all authed pages — never check auth inside the page
- [ ] No IDOR: route params validated against session user where applicable

### A02: Cryptographic Failures
- [ ] No secrets in client bundles (only `NEXT_PUBLIC_*` surfaces to browser)
- [ ] No secrets in logs (`lib/logger.ts`) — redact tokens, emails on error paths
- [ ] TLS only: `Strict-Transport-Security` enforced via `middleware.ts`
- [ ] Password hashing handled by Better Auth (do not roll your own)
- [ ] `crypto.subtle` or `crypto.randomUUID()` for randomness — never `Math.random()`

### A03: Injection
- [ ] All DB access goes through Drizzle ORM (`db()`, `repos.*`) — no raw SQL string concatenation
- [ ] User input parsed with Zod at every boundary (form actions, API routes, webhook bodies)
- [ ] HTML never built via string concat — use JSX or `dangerouslySetInnerHTML` only with JSON.stringify'd JSON-LD
- [ ] Shell: `child_process` is forbidden in Workers (there is no shell). Flag any attempt.

### A04: Insecure Design
- [ ] Rate limiting on the new route if it touches expensive resources or sends email — use `lib/rate-limit.ts`
- [ ] Turnstile required on any unauthenticated mutation (sign-in, sign-up, reset, contact, waitlist)
- [ ] Idempotency: any external-triggered mutation (webhooks, retryable jobs) uses `stripe_events`-style unique key pattern
- [ ] No destructive action on GET — only POST/PATCH/DELETE

### A05: Security Misconfiguration
- [ ] `lib/env.ts` Zod schema updated for any new env var
- [ ] New env vars added to `.env.example` with safe placeholder
- [ ] `wrangler.toml` updated for **both** `[env.preview]` and `[env.production]` blocks
- [ ] No secret committed — verify `git diff --cached` before every commit
- [ ] CSP updated in `lib/csp.ts` if you added a third-party script host (marketing CSP kept as strict as possible)
- [ ] `X-Robots-Tag: noindex` on any preview-only or internal route

### A06: Vulnerable & Outdated Components
- [ ] Dependabot already configured: review bumps, don't auto-ignore
- [ ] `pnpm audit` clean before merging a release
- [ ] Pin major versions in `package.json`; let minor/patch float
- [ ] Remove unused deps (`pnpm why <pkg>`) — each dep is attack surface

### A07: Identification & Authentication Failures
- [ ] Better Auth owns session/cookie — never set `Set-Cookie` manually
- [ ] `BETTER_AUTH_SECRET` is 32+ chars, per-env, in Wrangler secrets (not `vars`)
- [ ] 2FA available for every user (plugin is wired — don't disable it)
- [ ] Passkey `rpID` is stable per env (see `docs/runbooks/passkey-preview-domains.md`)
- [ ] Session cookie cache TTL stays at 5 min — don't bump it to "reduce DB reads"
- [ ] Reset tokens and magic links expire quickly (Better Auth default; do not extend)

### A08: Software & Data Integrity Failures
- [ ] `pnpm install --frozen-lockfile` in CI
- [ ] GitHub Actions pinned by version (not `@main`)
- [ ] Stripe webhook signature verified via `constructEventAsync` — never skip
- [ ] File uploads to R2 validate content-type and size at the boundary
- [ ] Deserialization: JSON.parse with Zod schema downstream, never trust shape

### A09: Security Logging & Monitoring Failures
- [ ] Use `log.info`/`log.warn`/`log.error` from `lib/logger.ts` for anything security-relevant
- [ ] Auth events (sign-in, sign-up, password reset, failed login, 2FA) go to `audit_log`
- [ ] Rate-limit rejections logged with `subject` and `bucket`
- [ ] Webhook signature failures logged at `warn`
- [ ] No PII in log bodies — use IDs, not emails/names

### A10: Server-Side Request Forgery (SSRF)
- [ ] Never `fetch()` a URL derived from unvalidated user input
- [ ] If user-supplied URLs are needed (webhooks, image proxies), validate against an allowlist and block RFC1918 / link-local / metadata hosts
- [ ] `global_fetch_strictly_public` compatibility flag is set in `wrangler.toml` — do not remove

### Before every PR

- Run `pnpm test && pnpm typecheck && pnpm lint`
- Re-read the diff with "what could an attacker do with this?" in mind
- If you added a route, write a test that a signed-out user gets 401
- If you touched auth, billing, or middleware, request a second review

---

## 3. Code quality — 12-Factor Apps + Clean Code

### 12-Factor (infra / ops discipline)

| Factor | How it shows up here | Rule |
|---|---|---|
| I. Codebase | One repo, many deploys | Never fork for a deploy variant. Use `[env.*]` in `wrangler.toml`. |
| II. Dependencies | Explicit in `package.json`; no system deps | Don't rely on anything in the runtime that isn't declared. |
| III. Config | In the env, never in code | New config → `lib/env.ts` + `.env.example` + `wrangler.toml`. Never hardcode. |
| IV. Backing services | Attached resources, swappable | DB access goes through `db/repo/*`. Stripe, Resend, R2 are attached via env. |
| V. Build / release / run | Distinct stages | `pnpm build` (build) → `wrangler deploy` (release) → Worker runs. Don't conflate. |
| VI. Processes | Stateless, share-nothing | No module-level mutable state. Worker invocations are independent. KV/D1/R2 for state. |
| VII. Port binding | Self-contained | Worker fetch handler is the interface. No external web server. |
| VIII. Concurrency | Horizontal | Workers scale automatically. Don't assume request affinity. |
| IX. Disposability | Fast start, graceful shutdown | No long startup. No background timers in-process — use Queues + Cron Triggers. |
| X. Dev / prod parity | Narrow the gap | Local uses real Wrangler, real Miniflare, real D1. Preview env mirrors prod. |
| XI. Logs | Event streams | `lib/logger.ts` → stdout JSON → Logpush → Axiom. No file logging. |
| XII. Admin processes | One-off against release | Admin tasks = Wrangler commands or Queue jobs, not ad-hoc `ssh`. |

### Clean Code (per-function discipline)

**Naming**
- Functions describe behavior: `recordStripeEventAndApply`, not `handleEvent`
- Booleans read as predicates: `hasActiveSubscription`, `isPreview` — never `flag`, `status`
- No Hungarian, no abbreviations unless domain-standard (`ctx`, `req`, `db` are fine; `usr`, `tmp`, `mgr` are not)
- File name === primary export name (`stripe.ts` exports `stripe*` helpers)

**Functions**
- Small. If scrolling is required to read one, split it.
- One reason to exist. If the name needs "and", split it.
- Arguments: 0–2 ideal, 3 tolerated, 4+ → refactor to an options object
- No side effects hidden in query functions. `findById` MUST NOT mutate.
- No flag arguments. `softDelete(id, true)` → `softDelete(id)` + `hardDelete(id)`.

**Comments**
- Default: write none. Good names and tests are the documentation.
- Acceptable: *why* a non-obvious decision was made (hidden invariant, subtle race, workaround for a specific bug)
- Forbidden: narrating *what* the code does, listing callers, referencing the current ticket ("for issue #123")
- TODOs must include an owner and a date: `// TODO(omar, 2026-06): swap to Analytics Engine when volume > 1M/day`

**Files**
- Keep files under ~2000 lines (global rule). Refactor before that.
- One concept per file. `lib/stripe.ts` holds Stripe; helpers for it live in the same file until they have three call sites.
- Import order: node built-ins → third-party → `@/*` aliases → relative
- No circular imports. If you need one, the design is wrong.

**Errors**
- Throw early, catch late. Only catch where you can recover or enrich.
- Never catch-and-ignore. Never `catch { /* noop */ }`.
- Never return `null` to mean "error" — throw, or return a discriminated union.
- Error messages describe what failed + enough context to fix it, not just "error"

**Control flow**
- Early return over nested `if`. Flatten pyramids.
- No magic numbers/strings. Extract constants (`GRACE_DAYS = 30`).
- Switch statements exhaustive: every enum/union has a case, with a `never`-typed default

**Typing**
- `strict: true` stays on. Don't disable.
- No `any`. `unknown` + narrowing is the right tool.
- No non-null assertions (`!`) except after a Zod parse or a checked narrowing on the line above.
- Prefer types over interfaces except for extensible public contracts (like `Repos`).
- Runtime validate at every trust boundary (form body, API body, webhook, env). Zod is the only validator.

**DRY, but not too early**
- Three similar lines is better than a premature abstraction
- Extract a helper when you see the pattern for the **third** time, not the first
- Don't design for hypothetical future requirements — YAGNI

**Boundaries**
- `app/` never imports from `db/repo/d1.ts` directly — goes through `@/db/repo/d1` (which re-exports the interface impl)
- Domain logic never imports from `next/*`. If you need `headers()`, pass values in.
- Third-party SDKs (Stripe, Resend) are wrapped in `lib/*.ts`. Routes import the wrapper, not the SDK.

---

## 4. Workflow summary

```
pick the smallest behavior delta
  → write failing test
  → implement minimum
  → refactor with tests green
  → OWASP Top 10 mental pass on the diff
  → pnpm test && pnpm typecheck && pnpm lint
  → commit (small, focused message)
  → PR with OWASP checklist filled in
```

Skip any step = PR rejected. No exceptions, including for "quick fixes".

---

## 5. When in doubt

- Read `docs/index.md` first, then the runbook matching your area.
- Search the codebase with `grep` / `ast-grep` before proposing a new helper — the pattern probably exists.
- Prefer editing existing files over creating new ones.
- If you can't decide between two approaches, the simpler one is correct.
- If both are simple, pick the one with fewer moving parts.
