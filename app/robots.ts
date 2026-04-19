import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (env.NEXT_PUBLIC_IS_PREVIEW) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard/", "/settings/"] },
    ],
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
    host: env.NEXT_PUBLIC_APP_URL,
  };
}
