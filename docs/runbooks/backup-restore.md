# Backup & Restore

## D1
- D1 has Time Travel (30-day rewind) built in.
- For disaster recovery, also run nightly export:
  ```bash
  wrangler d1 export saas_db --env production --output backup-$(date +%F).sql --remote
  # upload to R2
  wrangler r2 object put saas-backups/d1/$(date +%F).sql --file backup-$(date +%F).sql
  ```
- Schedule via GitHub Actions cron.

## R2
- Use R2 object lifecycle rules to replicate critical buckets.
- For account data exports, items written to `exports/` should be purged after 7 days.

## Restore
```bash
wrangler d1 execute saas_db --env production --file backup-YYYY-MM-DD.sql --remote
# or use time travel:
wrangler d1 time-travel restore saas_db --timestamp=2026-04-19T00:00:00Z --env production
```
