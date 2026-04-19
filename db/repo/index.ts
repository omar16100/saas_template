// Repository interface — isolates D1 so Postgres/Turso can slot in by swapping the impl.
// See docs/runbooks/d1-escape-hatch.md

import type { user, subscription, entitlement } from "@/db/schema";

type User = typeof user.$inferSelect;
type Subscription = typeof subscription.$inferSelect;
type Entitlement = typeof entitlement.$inferSelect;

export interface UserRepo {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<void>;
  softDelete(userId: string): Promise<void>;
}

export interface BillingRepo {
  hasProcessedStripeEvent(eventId: string): Promise<boolean>;
  recordStripeEventAndApply<T>(
    eventId: string,
    type: string,
    payloadHash: string,
    apply: () => Promise<T>,
  ): Promise<T | null>;
  upsertSubscription(sub: Subscription): Promise<void>;
  findActiveSubscription(userId: string): Promise<Subscription | null>;
}

export interface EntitlementRepo {
  grant(userId: string, feature: string, expiresAt?: Date): Promise<void>;
  revoke(userId: string, feature: string): Promise<void>;
  has(userId: string, feature: string): Promise<boolean>;
  list(userId: string): Promise<Entitlement[]>;
}

export interface Repos {
  users: UserRepo;
  billing: BillingRepo;
  entitlements: EntitlementRepo;
}
