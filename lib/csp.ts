// Route-scoped CSP. Marketing/blog get strict static CSP (keeps SSG/ISR caching).
// Auth/app routes get nonce CSP (dynamic, per-request).
// Stripe uses hosted Checkout/Portal (no embedded payment scripts needed).

type Policy = Record<string, string[]>;

const shared = (extra: Policy = {}): Policy => ({
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "img-src": ["'self'", "data:", "blob:", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://*.posthog.com",
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://challenges.cloudflare.com",
  ],
  "frame-src": ["https://challenges.cloudflare.com"],
  ...extra,
});

export function staticMarketingCsp(): string {
  const p = shared({
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.posthog.com",
      "https://challenges.cloudflare.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
  });
  return serialize(p);
}

export function dynamicAppCsp(nonce: string): string {
  const p = shared({
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      "https://challenges.cloudflare.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
  });
  return serialize(p);
}

function serialize(p: Policy): string {
  return Object.entries(p)
    .map(([k, v]) => `${k} ${v.join(" ")}`)
    .join("; ");
}

export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
} as const;
