import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

// Per-user rate-limit counters. Bucketed by (userId, bucket, windowStart).
export const rateLimit = sqliteTable("rate_limit", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
});

// Soft-deletion queue: rows here are purged by a Cron/Queue after the grace period.
export const deletionQueue = sqliteTable("deletion_queue", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  requestedAt: integer("requested_at", { mode: "timestamp" }).notNull(),
  purgeAt: integer("purge_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  purgeIdx: index("del_purge_idx").on(t.purgeAt),
}));

// Audit log (keep small — use Analytics Engine for high-volume events).
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  metadata: text("metadata"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  userIdx: index("audit_user_idx").on(t.userId),
  createdIdx: index("audit_created_idx").on(t.createdAt),
}));
