import { describe, it, expect, vi } from "vitest";
import { DrizzleQueryError } from "drizzle-orm";
import { log, describeError, logBetterAuthEvent } from "@/lib/logger";

describe("logger", () => {
  it("emits structured JSON", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log.info("hello", { x: 1 });
    const line = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("info");
    expect(parsed.msg).toBe("hello");
    expect(parsed.x).toBe(1);
    expect(parsed.ts).toBeTruthy();
    spy.mockRestore();
  });
});

describe("logging database errors", () => {
  const token = "session_token_must_not_be_logged";
  const failedQuery = () =>
    new DrizzleQueryError("select * from session where token = ?", [token], new Error("D1_ERROR: network"));

  it("describeError keeps the SQL and driver message but drops bound parameters", () => {
    const described = JSON.stringify(describeError(failedQuery()));
    expect(described).not.toContain(token);
    expect(described).toContain("select * from session where token = ?");
    expect(described).toContain("D1_ERROR: network");
  });

  it("Better Auth log lines never contain query parameters", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logBetterAuthEvent("error", "INTERNAL_SERVER_ERROR", failedQuery());
    const line = spy.mock.calls[0][0] as string;
    spy.mockRestore();
    expect(line).not.toContain(token);
    expect(JSON.parse(line).msg).toBe("better_auth: INTERNAL_SERVER_ERROR");
  });

  it("Better Auth log lines drop the params part when a raw query error message is the log message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logBetterAuthEvent("error", failedQuery().message);
    const line = spy.mock.calls[0][0] as string;
    spy.mockRestore();
    expect(line).not.toContain(token);
    expect(line).toContain("Failed query: select * from session where token = ?");
  });

  function errorLine(run: () => void) {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    run();
    const line = spy.mock.calls.map((call) => String(call[0])).join("\n");
    spy.mockRestore();
    return line;
  }

  it("Better Auth log lines survive an Error passed as the message and still hide parameters", () => {
    const line = errorLine(() => logBetterAuthEvent("error", failedQuery() as unknown as string));
    expect(line).not.toContain(token);
    expect(line).toContain("select * from session where token = ?");
  });

  it("Better Auth log lines hide parameters inside nested objects, arrays and extra strings", () => {
    const line = errorLine(() =>
      logBetterAuthEvent("error", "failed", { error: failedQuery() }, [failedQuery()], failedQuery().message),
    );
    expect(line).not.toContain(token);
  });

  it("describeError redacts parameter values that the driver echoes in its own message", () => {
    const err = new DrizzleQueryError("insert into session values (?)", [[token]], new Error(`D1_TYPE_ERROR: Type 'object' not supported for value '${token}'`));
    expect(JSON.stringify(describeError(err))).not.toContain(token);
  });

  it("describeError hides parameters of a query error nested as another query error's cause", () => {
    const inner = failedQuery();
    const outer = new DrizzleQueryError("select 1", [], inner);
    expect(JSON.stringify(describeError(outer))).not.toContain(token);
  });

  it("Better Auth log lines stay safe for deep, cyclic and BigInt arguments", () => {
    const cyclic: Record<string, unknown> = { error: failedQuery() };
    cyclic.self = cyclic;
    const deep = { a: { b: { c: { d: { e: { error: failedQuery() } } } } } };
    const line = errorLine(() => logBetterAuthEvent("error", "failed", deep, cyclic, BigInt(7)));
    expect(line).not.toContain(token);
    expect(JSON.parse(line).msg).toBe("better_auth: failed");
  });

  it("describeError copes with cyclic parameter arrays", () => {
    const params: unknown[] = [token];
    params.push(params);
    const err = new DrizzleQueryError("select ?", params, new Error(`D1_ERROR: bad value ${token}`));
    expect(JSON.stringify(describeError(err))).not.toContain(token);
  });
});

