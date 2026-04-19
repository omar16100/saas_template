# Contributing

Thanks for the interest.

## Ground rules

- **Keep it opinionated.** This template picks one way to do each thing. PRs that add a second way (e.g., an alternative auth lib, a second DB adapter) are rejected. Fork if you want a variant.
- **No half-features.** Every feature has schema + UI + tests + docs + wiring in both `[env.preview]` and `[env.production]`. If you can't finish all of those, open an issue instead of a PR.
- **Trim aggressively.** If a feature is niche (status page, newsletter, i18n), document it as an extension in `docs/` — don't add it to the main template.

## Setup

```bash
pnpm install
cp .env.example .env.local
# fill in BETTER_AUTH_SECRET
pnpm dev
```

## Before submitting a PR

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e       # optional — requires the dev server running
```

## Commit style

Concise, imperative. Examples:
- `add passkey registration flow`
- `fix stripe webhook idempotency under D1 contention`
- `docs: d1-escape-hatch note on Turso migration`

## Reporting issues

- Reproducible bug → include `wrangler --version`, `node --version`, exact command, full error
- Feature request → describe the use case, not the implementation
- Security → email directly (see `SECURITY.md`), do not open a public issue
