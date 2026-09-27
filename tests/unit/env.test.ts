import { describe, it, expect } from "vitest";
import { envSchema } from "@/lib/env";

const base = { NEXT_PUBLIC_APP_URL: "https://example.com" };

describe("envSchema NEXT_PUBLIC_IS_PREVIEW", () => {
  it("treats the string \"false\" as false", () => {
    expect(envSchema.parse({ ...base, NEXT_PUBLIC_IS_PREVIEW: "false" }).NEXT_PUBLIC_IS_PREVIEW).toBe(false);
  });

  it("treats the string \"true\" as true", () => {
    expect(envSchema.parse({ ...base, NEXT_PUBLIC_IS_PREVIEW: "true" }).NEXT_PUBLIC_IS_PREVIEW).toBe(true);
  });

  it("defaults to false when unset", () => {
    expect(envSchema.parse(base).NEXT_PUBLIC_IS_PREVIEW).toBe(false);
  });
});

describe("envSchema validation", () => {
  it("rejects an NEXT_PUBLIC_APP_URL that is not a URL", () => {
    expect(envSchema.safeParse({ NEXT_PUBLIC_APP_URL: "not a url" }).success).toBe(false);
  });

  it("rejects a RESEND_FROM_EMAIL that is not an email address", () => {
    expect(envSchema.safeParse({ ...base, RESEND_FROM_EMAIL: "nobody" }).success).toBe(false);
  });

  it("accepts a complete minimal config and applies defaults", () => {
    const env = envSchema.parse({ ...base, RESEND_FROM_EMAIL: "hello@example.com" });
    expect(env.NEXT_PUBLIC_APP_NAME).toBe("SaaS Template");
    expect(env.BETTER_AUTH_RP_ID).toBe("localhost");
  });
});
