import { env } from "@/lib/env";
import { getAllPosts } from "@/lib/blog";

export const revalidate = 3600;

export async function GET() {
  const base = env.NEXT_PUBLIC_APP_URL;
  const posts = await getAllPosts();
  const items = posts
    .map(
      (p) => `<item>
  <title><![CDATA[${p.title}]]></title>
  <link>${base}/blog/${p.slug}</link>
  <guid>${base}/blog/${p.slug}</guid>
  <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
  <description><![CDATA[${p.description ?? ""}]]></description>
</item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${env.NEXT_PUBLIC_APP_NAME} Blog</title>
  <link>${base}/blog</link>
  <description>Blog RSS feed</description>
  <language>en</language>
  <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml" />
  ${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
