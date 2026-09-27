import { describe, it, expect, vi, beforeAll } from "vitest";

const { createSession } = vi.hoisted(() => ({ createSession: vi.fn(async () => ({ id: "cs_test" })) }));
vi.mock("stripe", () => ({
  default: vi.fn(function () {
    return { checkout: { sessions: { create: createSession } } };
  }),
}));

async function createTestSession() {
  const { createCheckoutSession } = await import("@/lib/stripe");
  await createCheckoutSession({
    userId: "user_1",
    email: "user@example.com",
    priceId: "price_1",
    successUrl: "https://example.com/ok",
    cancelUrl: "https://example.com/cancel",
  });
  const [params] = createSession.mock.calls.at(-1) as unknown as [Record<string, unknown>];
  return params as { subscription_data?: { metadata?: Record<string, string>; billing_mode?: { type: string } } };
}

describe("createCheckoutSession", () => {
  beforeAll(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "stripe-key-for-unit-tests");
  });

  it("puts the user id on the subscription so customer.subscription.* webhooks can map it to a user", async () => {
    const params = await createTestSession();
    expect(params.subscription_data?.metadata?.userId).toBe("user_1");
  });

  it("pins classic billing mode so cancel_at_period_end keeps meaning scheduled cancellation", async () => {
    const params = await createTestSession();
    expect(params.subscription_data?.billing_mode?.type).toBe("classic");
  });
});
