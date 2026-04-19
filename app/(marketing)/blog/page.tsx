import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles and updates.",
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">Blog</h1>
      <ul className="mt-10 space-y-6">
        {posts.map((p) => (
          <li key={p.slug} className="border-b pb-6">
            <Link href={`/blog/${p.slug}`} className="group">
              <h2 className="text-2xl font-semibold group-hover:underline">{p.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <time dateTime={p.publishedAt}>{new Date(p.publishedAt).toLocaleDateString()}</time>
              </p>
              {p.description && <p className="mt-2 text-muted-foreground">{p.description}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
