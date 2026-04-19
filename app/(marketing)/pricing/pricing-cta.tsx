"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PricingCta({ plan }: { plan: "pro_monthly" | "pro_yearly" }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: plan === "pro_monthly"
          ? process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY
          : process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY,
      }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  return <Button onClick={onClick} disabled={loading}>{loading ? "Loading..." : "Upgrade"}</Button>;
}
