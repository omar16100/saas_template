import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deletionQueue } from "@/db/schema";
import { repos } from "@/db/repo/d1";
import { sendDeletionConfirmEmail } from "@/lib/resend";
import { cfEnv } from "@/lib/cf";
import { log } from "@/lib/logger";

const GRACE_DAYS = 30;

export async function POST(req: Request) {
  const session = await getAuth().api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const purgeAt = new Date(now.getTime() + GRACE_DAYS * 86400_000);

  await repos.users.softDelete(session.user.id);
  await db()
    .insert(deletionQueue)
    .values({ userId: session.user.id, requestedAt: now, purgeAt })
    .onConflictDoUpdate({ target: deletionQueue.userId, set: { requestedAt: now, purgeAt } });

  try {
    const { JOBS } = cfEnv();
    await JOBS.send({ type: "user.purge", userId: session.user.id, purgeAt: purgeAt.toISOString() });
  } catch (e) {
    log.warn("queue_enqueue_failed", { err: String(e) });
  }

  await sendDeletionConfirmEmail(session.user.email, purgeAt);
  log.info("account_deletion_requested", { userId: session.user.id, purgeAt: purgeAt.toISOString() });

  return NextResponse.json({ scheduled: true, purgeAt: purgeAt.toISOString() });
}

export async function DELETE(req: Request) {
  // Cancel scheduled deletion.
  const session = await getAuth().api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await db().delete(deletionQueue).where(eq(deletionQueue.userId, session.user.id));
  return NextResponse.json({ canceled: true });
}
