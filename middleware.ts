import { NextResponse, type NextRequest } from "next/server";
import { staticMarketingCsp, dynamicAppCsp, securityHeaders } from "@/lib/csp";

const REDIRECTS: Record<string, string> = {
  // "/old-path": "/new-path",
};

const APP_PREFIXES = ["/dashboard", "/settings", "/sign-in", "/sign-up", "/reset"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const dest = REDIRECTS[pathname];
  if (dest) return NextResponse.redirect(new URL(dest, req.url), 301);

  const isApp = APP_PREFIXES.some((p) => pathname.startsWith(p));
  const isPreview = process.env.NEXT_PUBLIC_IS_PREVIEW === "true";

  const res = NextResponse.next();

  if (isApp) {
    const nonce = crypto.randomUUID().replace(/-/g, "");
    res.headers.set("x-nonce", nonce);
    res.headers.set("Content-Security-Policy", dynamicAppCsp(nonce));
  } else {
    res.headers.set("Content-Security-Policy", staticMarketingCsp());
  }

  for (const [k, v] of Object.entries(securityHeaders)) res.headers.set(k, v);

  if (isPreview) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
