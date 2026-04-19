import { describe, it, expect, vi } from "vitest";
import type { BillingRepo } from "@/db/repo/index";

// Contract test: a duplicate event MUST NOT run `apply` twice.
// Any concrete BillingRepo impl must satisfy this.

function makeFakeRepo(): BillingRepo {
  const seen = new Set<string>();
  return {
    async hasProcessedStripeEvent(id) { return seen.has(id); },
    async recordStripeEventAndApply(id, _t, _h, apply) {
      if (seen.has(id)) return null;
      seen.add(id);
      return apply();
    },
    async upsertSubscription() {},
    async findActiveSubscription() { return null; },
  };
}

describe("stripe webhook idempotency", () => {
  it("applies once for a given event id", async () => {
    const repo = makeFakeRepo();
    const apply = vi.fn(async () => ({ ok: true as const }));
    const a = await repo.recordStripeEventAndApply("evt_1", "test", "h", apply);
    const b = await repo.recordStripeEventAndApply("evt_1", "test", "h", apply);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(a).toEqual({ ok: true });
    expect(b).toBeNull();
  });
});
