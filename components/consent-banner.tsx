"use client";

import { useEffect, useState } from "react";

const KEY = "consent-v1";

export function useConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  useEffect(() => {
    const v = localStorage.getItem(KEY);
    setConsent(v === "granted" ? true : v === "denied" ? false : null);
  }, []);
  function set(v: boolean) {
    localStorage.setItem(KEY, v ? "granted" : "denied");
    setConsent(v);
    window.dispatchEvent(new Event("consent-change"));
  }
  return { consent, grant: () => set(true), deny: () => set(false) };
}

export function ConsentBanner() {
  const { consent, grant, deny } = useConsent();
  if (consent !== null) return null;
  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-lg border bg-background p-4 shadow-lg">
      <p className="text-sm">
        We use cookies for analytics. See our{" "}
        <a href="/privacy" className="underline">privacy policy</a>.
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={deny} className="h-9 rounded-md border px-3 text-sm">Reject</button>
        <button onClick={grant} className="h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground">
          Accept
        </button>
      </div>
    </div>
  );
}
