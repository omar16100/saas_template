import { describe, it, expect } from "vitest";
import type { Stripe } from "stripe";
import { subscriptionCurrentPeriodEnd } from "@/lib/stripe";

function makeSubscription(items: Array<{ current_period_end: number }>): Stripe.Subscription {
  return { id: "sub_test", items: { data: items } } as unknown as Stripe.Subscription;
}

describe("subscriptionCurrentPeriodEnd", () => {
  it("reads current_period_end from the first subscription item", () => {
    const sub = makeSubscription([{ current_period_end: 1_800_000_000 }, { current_period_end: 1_900_000_000 }]);
    expect(subscriptionCurrentPeriodEnd(sub)).toEqual(new Date(1_800_000_000 * 1000));
  });

  it("throws with the subscription id when there are no items", () => {
    expect(() => subscriptionCurrentPeriodEnd(makeSubscription([]))).toThrow(/sub_test/);
  });
});
