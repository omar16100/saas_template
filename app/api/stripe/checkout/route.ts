import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";
import { repos } from "@/db/repo/d1";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { priceId } = (await req.json()) as { priceId: string };
  if (!priceId) return NextResponse.json({ error: "priceId required" }, { status: 400 });

  const user = await repos.users.findById(session.user.id);
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });

  const checkout = await createCheckoutSession({
    userId: user.id,
    email: user.email,
    priceId,
    stripeCustomerId: user.stripeCustomerId,
    successUrl: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return NextResponse.json({ url: checkout.url });
}
