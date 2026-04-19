import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL;
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cookies`, changeFrequency: "yearly", priority: 0.3 },
  ];
  const posts = await getAllPosts();
  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.updatedAt ?? p.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));
  return [...staticRoutes, ...postRoutes];
}
