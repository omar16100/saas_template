import { describe, it, expect, vi } from "vitest";

const { getCloudflareContext } = vi.hoisted(() => ({ getCloudflareContext: vi.fn() }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext }));

// `next build` evaluates route modules outside a request, where the Cloudflare context
// (and so the D1 binding) does not exist. Importing lib/auth must not reach for it.
describe("lib/auth", () => {
  it("does not read the Cloudflare request context at import time", async () => {
    await import("@/lib/auth");
    expect(getCloudflareContext).not.toHaveBeenCalled();
  });
});
