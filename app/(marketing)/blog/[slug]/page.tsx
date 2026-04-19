import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { env } from "@/lib/env";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.description, type: "article" },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const url = `${env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`;
  return (
    <article className="mx-auto max-w-2xl px-4 py-16">
      <ArticleJsonLd
        headline={post.title}
        description={post.description}
        author={post.author}
        datePublished={post.publishedAt}
        dateModified={post.updatedAt}
        url={url}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
          { name: "Blog", url: `${env.NEXT_PUBLIC_APP_URL}/blog` },
          { name: post.title, url },
        ]}
      />
      <header>
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString()}</time>
          {post.author && <> · {post.author}</>}
        </p>
      </header>
      <div className="prose mt-8 max-w-none dark:prose-invert">
        <pre className="whitespace-pre-wrap">{post.content}</pre>
      </div>
    </article>
  );
}
