import type { Metadata } from "next";
import { SoftwareAppJsonLd } from "@/components/json-ld";
import { PricingCta } from "./pricing-cta";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing.",
};

const plans = [
  { name: "Free", price: "$0", features: ["Up to 100 users", "Community support"], cta: null },
  { name: "Pro", price: "$19/mo", features: ["Unlimited users", "Email support", "All features"], cta: "pro_monthly" as const },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20">
      <SoftwareAppJsonLd name="Pro Plan" price="19" currency="USD" />
      <h1 className="text-4xl font-bold">Pricing</h1>
      <p className="mt-3 text-muted-foreground">Start free. Upgrade anytime.</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {plans.map((p) => (
          <div key={p.name} className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold">{p.name}</h2>
            <p className="mt-2 text-3xl font-bold">{p.price}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {p.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
            <div className="mt-6">
              {p.cta ? <PricingCta plan={p.cta} /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
