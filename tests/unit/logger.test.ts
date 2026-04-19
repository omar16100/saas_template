import { describe, it, expect, vi } from "vitest";
import { log } from "@/lib/logger";

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
