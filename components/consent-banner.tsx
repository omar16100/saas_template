"use client";

import { useSyncExternalStore } from "react";

const KEY = "consent-v1";
const CHANGE_EVENT = "consent-change";

function readConsent(): boolean | null {
  const v = localStorage.getItem(KEY);
  return v === "granted" ? true : v === "denied" ? false : null;
}

function readServerConsent(): boolean | null {
  return null;
}

function subscribeToConsent(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useConsent() {
  const consent = useSyncExternalStore(subscribeToConsent, readConsent, readServerConsent);
  function set(v: boolean) {
    localStorage.setItem(KEY, v ? "granted" : "denied");
    window.dispatchEvent(new Event(CHANGE_EVENT));
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
