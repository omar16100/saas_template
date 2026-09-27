import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { stripe, subscriptionCurrentPeriodEnd } from "@/lib/stripe";
import { env } from "@/lib/env";
import { repos } from "@/db/repo/d1";
import { log } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    log.warn("stripe_webhook_signature_failed", { err: String(err) });
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const payloadHash = await sha256(body);

  const result = await repos.billing.recordStripeEventAndApply(
    event.id,
    event.type,
    payloadHash,
    async () => {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.client_reference_id ?? session.metadata?.userId;
          const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
          if (userId && customerId) {
            await repos.users.setStripeCustomerId(userId, customerId);
          }
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const userId = (sub.metadata?.userId as string | undefined) ?? null;
          if (!userId) {
            log.warn("stripe_sub_missing_userId", { id: sub.id });
            break;
          }
          await repos.billing.upsertSubscription({
            id: sub.id,
            userId,
            stripeSubscriptionId: sub.id,
            stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
            stripePriceId: sub.items.data[0]?.price.id ?? "",
            status: sub.status,
            currentPeriodEnd: subscriptionCurrentPeriodEnd(sub),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            createdAt: new Date(sub.created * 1000),
            updatedAt: new Date(),
          });
          break;
        }
        default:
          log.info("stripe_webhook_unhandled", { type: event.type });
      }
      return { ok: true as const };
    },
  );

  if (result === null) {
    log.info("stripe_webhook_duplicate", { id: event.id, type: event.type });
  } else {
    log.info("stripe_webhook_processed", { id: event.id, type: event.type });
  }
  return NextResponse.json({ received: true });
}
