import Stripe from "stripe";
import { env } from "./env";

export function stripe() {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-12-18.acacia" as never });
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
  });
}

export async function createPortalSession(opts: { stripeCustomerId: string; returnUrl: string }) {
  return stripe().billingPortal.sessions.create({
    customer: opts.stripeCustomerId,
    return_url: opts.returnUrl,
  });
}
