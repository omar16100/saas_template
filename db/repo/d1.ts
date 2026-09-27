import { eq, and } from "drizzle-orm";
import { db as getDb } from "@/lib/db";
import { user, subscription, entitlement, stripeEvents } from "@/db/schema";
import type { Repos, UserRepo, BillingRepo, EntitlementRepo } from "./index";

const users: UserRepo = {
  async findById(id) {
    const rows = await getDb().select().from(user).where(eq(user.id, id)).limit(1);
    return rows[0] ?? null;
  },
  async findByEmail(email) {
    const rows = await getDb().select().from(user).where(eq(user.email, email)).limit(1);
    return rows[0] ?? null;
  },
  async setStripeCustomerId(userId, stripeCustomerId) {
    await getDb().update(user).set({ stripeCustomerId, updatedAt: new Date() }).where(eq(user.id, userId));
  },
  async softDelete(userId) {
    await getDb().update(user).set({ deletedAt: new Date() }).where(eq(user.id, userId));
  },
};

const billing: BillingRepo = {
  async hasProcessedStripeEvent(eventId) {
    const rows = await getDb().select().from(stripeEvents).where(eq(stripeEvents.eventId, eventId)).limit(1);
    return rows.length > 0;
  },
  async recordStripeEventAndApply(eventId, type, payloadHash, apply) {
    // D1 lacks multi-statement transactions; INSERT with PK conflict guards against duplicates.
    try {
      await getDb().insert(stripeEvents).values({
        eventId,
        type,
        payloadHash,
        receivedAt: new Date(),
      });
    } catch {
      return null; // duplicate — already processed
    }
    return apply();
  },
  async upsertSubscription(sub) {
    await getDb()
      .insert(subscription)
      .values(sub)
      .onConflictDoUpdate({
        target: subscription.stripeSubscriptionId,
        set: {
          status: sub.status,
          stripePriceId: sub.stripePriceId,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          updatedAt: new Date(),
        },
      });
  },
  async findActiveSubscription(userId) {
    const rows = await getDb()
      .select()
      .from(subscription)
      .where(and(eq(subscription.userId, userId), eq(subscription.status, "active")))
      .limit(1);
    return rows[0] ?? null;
  },
};

const entitlements: EntitlementRepo = {
  async grant(userId, feature, expiresAt) {
    await getDb().insert(entitlement).values({
      id: crypto.randomUUID(),
      userId,
      feature,
      grantedAt: new Date(),
      expiresAt: expiresAt ?? null,
    });
  },
  async revoke(userId, feature) {
    await getDb()
      .delete(entitlement)
      .where(and(eq(entitlement.userId, userId), eq(entitlement.feature, feature)));
  },
  async has(userId, feature) {
    const now = new Date();
    const rows = await getDb()
      .select()
      .from(entitlement)
      .where(
        and(
          eq(entitlement.userId, userId),
          eq(entitlement.feature, feature),
        ),
      )
      .limit(1);
    const row = rows[0];
    if (!row) return false;
    if (row.expiresAt && row.expiresAt < now) return false;
    return true;
  },
  async list(userId) {
    return getDb().select().from(entitlement).where(eq(entitlement.userId, userId));
  },
};

export const repos: Repos = { users, billing, entitlements };
