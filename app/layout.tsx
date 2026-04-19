import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Analytics } from "@/components/analytics";
import { ConsentBanner } from "@/components/consent-banner";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/json-ld";
import { env } from "@/lib/env";
import "./globals.css";

const APP_URL = env.NEXT_PUBLIC_APP_URL;
const APP_NAME = env.NEXT_PUBLIC_APP_NAME;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: "Cloudflare-first SaaS starter.",
  applicationName: APP_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description: "Cloudflare-first SaaS starter.",
  },
  twitter: { card: "summary_large_image", title: APP_NAME },
  robots: {
    index: env.NEXT_PUBLIC_IS_PREVIEW ? false : true,
    follow: env.NEXT_PUBLIC_IS_PREVIEW ? false : true,
  },
  verification: {
    google: env.GOOGLE_SITE_VERIFICATION,
    other: env.BING_SITE_VERIFICATION ? { "msvalidate.01": env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="light">
          {children}
          <ConsentBanner />
          <Analytics />
          <OrganizationJsonLd />
          <WebSiteJsonLd />
        </ThemeProvider>
      </body>
    </html>
  );
}
