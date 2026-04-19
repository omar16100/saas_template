"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string;
      remove: (id: string) => void;
    };
  }
}

export function Turnstile({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!ref.current || !window.turnstile || !siteKey) return;
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      callback: onVerify,
    });
    return () => {
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
    };
  }, [siteKey, onVerify]);

  if (!siteKey) {
    // Auto-verify in dev when not configured.
    useEffect(() => onVerify("dev-token"), [onVerify]);
    return null;
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div ref={ref} />
    </>
  );
}
