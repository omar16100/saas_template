# D1 Escape Hatch

D1 limits (as of 2026):
- 10 GB per database
- Single-threaded writes → overload under concurrent bursts
- 30s query cap
- 100 bound params per statement
- 2 MB row/value size

## When to swap
Swap to Postgres (Neon, Supabase) or Turso when:
- You approach 5 GB (give yourself 50% headroom)
- p99 write latency climbs past 100ms under normal load
- You need multi-statement transactions

## How to swap
Every domain call goes through `db/repo/*`. To move off D1:

1. Implement `db/repo/postgres.ts` that satisfies `db/repo/index.ts`.
2. Replace the import in call sites:
   ```ts
   import { repos } from "@/db/repo/d1";
   // becomes
   import { repos } from "@/db/repo/postgres";
   ```
3. Migrate Drizzle schema to `pg-core` (it's mostly the same).
4. Move high-volume tables OUT of main DB:
   - Audit logs → Analytics Engine (CF) or ClickHouse
   - Usage metering → Analytics Engine
   - Rate-limit counters → Durable Objects (already edge-native)

## What NOT to store in D1
- Raw event streams
- Per-request metering rows (aggregate first)
- Session tokens beyond what Better Auth needs (use KV for cookie cache)
