import { eq } from "drizzle-orm";
import { db } from "./db";
import { rateLimit } from "@/db/schema";

// Fixed-window counter in D1. Key = `${bucket}:${subject}:${windowStart}`.
export async function check(opts: {
  bucket: string;
  subject: string;
  limit: number;
  windowSec: number;
}): Promise<{ ok: boolean; remaining: number; resetAt: Date }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % opts.windowSec);
  const key = `${opts.bucket}:${opts.subject}:${windowStart}`;
  const resetAt = new Date((windowStart + opts.windowSec) * 1000);

  const d = db();
  const existing = await d.select().from(rateLimit).where(eq(rateLimit.key, key)).limit(1);
  const current = existing[0];

  if (!current) {
    await d.insert(rateLimit).values({ key, count: 1, windowStart: new Date(windowStart * 1000) });
    return { ok: true, remaining: opts.limit - 1, resetAt };
  }

  if (current.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt };
  }

  await d.update(rateLimit).set({ count: current.count + 1 }).where(eq(rateLimit.key, key));
  return { ok: true, remaining: opts.limit - current.count - 1, resetAt };
}
