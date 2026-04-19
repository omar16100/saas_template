"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import posthog from "posthog-js";

export function Analytics() {
  const [consent, setConsent] = useState<boolean | null>(null);
  const ga4 = process.env.NEXT_PUBLIC_GA4_ID;
  const phKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const phHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  useEffect(() => {
    const read = () => {
      const v = localStorage.getItem("consent-v1");
      setConsent(v === "granted" ? true : v === "denied" ? false : null);
    };
    read();
    window.addEventListener("consent-change", read);
    return () => window.removeEventListener("consent-change", read);
  }, []);

  useEffect(() => {
    if (consent !== true) return;
    if (phKey && phHost && typeof window !== "undefined" && !posthog.__loaded) {
      posthog.init(phKey, { api_host: phHost, capture_pageview: true });
    }
  }, [consent, phKey, phHost]);

  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;
    import("web-vitals").then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const send = (m: { name: string; value: number }) => {
        if (posthog.__loaded) posthog.capture("web_vital", { name: m.name, value: m.value });
      };
      onCLS(send);
      onINP(send);
      onLCP(send);
      onFCP(send);
      onTTFB(send);
    });
  }, []);

  if (consent !== true) return null;

  return (
    <>
      {ga4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ga4}');
          `}</Script>
        </>
      )}
    </>
  );
}
