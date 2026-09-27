import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { repos } from "@/db/repo/d1";
import { cfEnv } from "@/lib/cf";
import { log } from "@/lib/logger";

export async function POST(req: Request) {
  const session = await getAuth().api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await repos.users.findById(session.user.id);
  const entitlements = await repos.entitlements.list(session.user.id);
  const activeSub = await repos.billing.findActiveSubscription(session.user.id);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    entitlements,
    subscription: activeSub,
  };

  const key = `exports/${session.user.id}-${Date.now()}.json`;
  const { UPLOADS } = cfEnv();
  await UPLOADS.put(key, JSON.stringify(payload, null, 2), {
    httpMetadata: { contentType: "application/json" },
  });

  log.info("account_export_created", { userId: session.user.id, key });
  return NextResponse.json({ key, message: "Export created. Contact support for a signed URL or integrate R2 presigning." });
}
