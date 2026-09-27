import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import { DrizzleQueryError } from "drizzle-orm";
import { logBetterAuthEvent } from "@/lib/logger";

const TOKEN = "verification_token_must_not_be_logged";
const { getCloudflareContext } = vi.hoisted(() => ({ getCloudflareContext: vi.fn() }));
vi.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext }));

// vitest 4 no longer infers argument types through ReturnType<typeof vi.spyOn>, so name the console signature.
type ConsoleSpy = MockInstance<(...data: unknown[]) => void>;

function consoleOutput(spies: ConsoleSpy[]) {
  return spies.flatMap((spy) => spy.mock.calls.map((call) => call.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" "))).join("\n");
}

describe("auth error logging", () => {
  let spies: ConsoleSpy[];
  beforeEach(() => {
    spies = (["log", "info", "warn", "error", "debug"] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
  });
  afterEach(() => spies.forEach((spy) => spy.mockRestore()));

  it("handleAuthRequest turns an unexpected query error into a bare 500 without logging its parameters", async () => {
    getCloudflareContext.mockImplementation(() => {
      throw new DrizzleQueryError("select * from verification where identifier = ?", [TOKEN], new Error("D1_ERROR: outage"));
    });
    const { handleAuthRequest } = await import("@/lib/auth");
    const res = await handleAuthRequest(new Request("http://localhost:3000/api/auth/magic-link/verify?token=x"));
    expect(res.status).toBe(500);
    const output = consoleOutput(spies);
    expect(output).toContain("auth_request_failed");
    expect(output).not.toContain(TOKEN);
  });

  it("Better Auth is configured to rethrow unexpected errors and to log through logBetterAuthEvent", async () => {
    getCloudflareContext.mockImplementation(() => ({ env: { DB: {} } }));
    const { getAuth } = await import("@/lib/auth");
    const { options } = getAuth();
    expect(options.onAPIError?.throw).toBe(true);
    expect(options.logger?.log).toBe(logBetterAuthEvent);
  });
});
