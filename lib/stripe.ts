import Stripe from "stripe";
import { env } from "./env";

export function stripe() {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-08-26.dahlia" });
}

// Since API version 2025-03-31.basil, billing periods live on subscription items, not the subscription.
// The first item is the one whose price we store (see the webhook route), so read its period too.
export function subscriptionCurrentPeriodEnd(sub: Stripe.Subscription): Date {
  const item = sub.items.data[0];
  if (!item) throw new Error(`stripe subscription ${sub.id} has no items, cannot read current_period_end`);
  return new Date(item.current_period_end * 1000);
}

export async function createCheckoutSession(opts: {
  userId: string;
  email: string;
  priceId: string;
  stripeCustomerId?: string | null;
  successUrl: string;
  cancelUrl: string;
}) {
  const s = stripe();
  return s.checkout.sessions.create({
    mode: "subscription",
    customer: opts.stripeCustomerId ?? undefined,
    customer_email: opts.stripeCustomerId ? undefined : opts.email,
    client_reference_id: opts.userId,
    line_items: [{ price: opts.priceId, quantity: 1 }],
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    billing_address_collection: "auto",
    metadata: { userId: opts.userId },
    subscription_data: {
      // Session metadata does not reach the Subscription; the webhook reads userId from the Subscription.
      metadata: { userId: opts.userId },
      // API versions from 2025-09-30.clover default to flexible billing, where portal cancellations set
      // `cancel_at` instead of `cancel_at_period_end`, which is the field we store.
      billing_mode: { type: "classic" },
    },
  });
}

export async function createPortalSession(opts: { stripeCustomerId: string; returnUrl: string }) {
  return stripe().billingPortal.sessions.create({
    customer: opts.stripeCustomerId,
    return_url: opts.returnUrl,
  });
}
