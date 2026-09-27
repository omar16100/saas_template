import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { createPortalSession } from "@/lib/stripe";
import { repos } from "@/db/repo/d1";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const session = await getAuth().api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await repos.users.findById(session.user.id);
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "no customer" }, { status: 400 });
  }

  const portal = await createPortalSession({
    stripeCustomerId: user.stripeCustomerId,
    returnUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}
