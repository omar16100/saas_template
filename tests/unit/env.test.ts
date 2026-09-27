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
