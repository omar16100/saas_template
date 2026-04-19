import { describe, it, expect } from "vitest";
import { staticMarketingCsp, dynamicAppCsp, securityHeaders } from "@/lib/csp";

describe("csp", () => {
  it("marketing CSP allows analytics hosts", () => {
    const csp = staticMarketingCsp();
    expect(csp).toContain("www.googletagmanager.com");
    expect(csp).toContain("posthog.com");
    expect(csp).toContain("challenges.cloudflare.com");
  });

  it("app CSP uses nonce and strict-dynamic", () => {
    const csp = dynamicAppCsp("abc123");
    expect(csp).toContain("'nonce-abc123'");
    expect(csp).toContain("'strict-dynamic'");
  });

  it("security headers include HSTS and X-Frame-Options DENY", () => {
    expect(securityHeaders["Strict-Transport-Security"]).toMatch(/max-age=/);
    expect(securityHeaders["X-Frame-Options"]).toBe("DENY");
  });
});
