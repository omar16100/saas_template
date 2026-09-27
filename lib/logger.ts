type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, msg: string, data?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...data,
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  debug: (msg: string, data?: Record<string, unknown>) => emit("debug", msg, data),
  info: (msg: string, data?: Record<string, unknown>) => emit("info", msg, data),
  warn: (msg: string, data?: Record<string, unknown>) => emit("warn", msg, data),
  error: (msg: string, data?: Record<string, unknown>) => emit("error", msg, data),
};

// DrizzleQueryError messages are "Failed query: <sql>\nparams: <values>".
const QUERY_PARAMS_MARKER = "\nparams: ";
const MAX_LOG_DEPTH = 4;

function cutQueryParams(text: string): string {
  return text.split(QUERY_PARAMS_MARKER)[0];
}

function isQueryError(err: Error): err is Error & { query: unknown; params: unknown } {
  return "query" in err && "params" in err;
}

// String values among the bound parameters (nested arrays included, bounded, cycle-safe).
function paramStrings(params: unknown, depth = 0, seen = new WeakSet<object>()): string[] {
  if (typeof params === "string") return [params];
  if (!Array.isArray(params) || depth >= MAX_LOG_DEPTH || seen.has(params)) return [];
  seen.add(params);
  return params.flatMap((item) => paramStrings(item, depth + 1, seen));
}

// Replaces every string parameter (4+ chars, so ids and tokens but not flags) echoed back in `text`.
function redactParams(text: string, params: unknown): string {
  return paramStrings(params)
    .filter((value) => value.length >= 4)
    .reduce((acc, value) => acc.split(value).join("[redacted]"), text);
}

// Only fields that are safe to ship to log storage. drizzle-orm >= 0.44 wraps driver failures in
// DrizzleQueryError, whose message, stack and enumerable `params` carry bound values such as session
// tokens. For those we keep the SQL text (placeholders only) and the cause with parameters redacted.
export function describeError(err: unknown, depth = 0, outerParams: unknown[] = []): Record<string, unknown> {
  if (!(err instanceof Error)) return { error: typeof err };
  if (isQueryError(err)) {
    const params = [...outerParams, err.params];
    const cause = depth < MAX_LOG_DEPTH && err.cause instanceof Error ? describeError(err.cause, depth + 1, params) : undefined;
    return { name: err.name, query: String(err.query), cause };
  }
  // Wrappers sometimes copy a query error's message into their own; drivers may echo bound values.
  return { name: err.name, message: redactParams(cutQueryParams(err.message), outerParams) };
}

// JSON-safe copy of a log argument: errors described, strings cut, deep or cyclic parts replaced.
function toLogSafe(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) return describeError(value);
  if (typeof value === "string") return cutQueryParams(value);
  if (typeof value === "bigint") return value.toString();
  if (value === null || typeof value !== "object") return value;
  if (depth >= MAX_LOG_DEPTH) return "[truncated]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => toLogSafe(item, depth + 1, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toLogSafe(item, depth + 1, seen)]));
}

// Better Auth `logger.log` hook: routes its messages through the JSON logger with errors described
// by describeError (also inside objects and arrays), instead of Better Auth's default console output
// of raw error objects. Better Auth sometimes passes `error.message`, or the error itself, as `message`.
export function logBetterAuthEvent(level: Level, message: unknown, ...args: unknown[]) {
  const text = message instanceof Error ? "error" : cutQueryParams(String(message));
  const details = (message instanceof Error ? [message, ...args] : args).map((arg) => toLogSafe(arg));
  emit(level, `better_auth: ${text}`, details.length > 0 ? { details } : undefined);
}
