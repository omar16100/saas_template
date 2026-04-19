import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const config: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async redirects() {
    return [];
  },
};

export default withMDX(config);
