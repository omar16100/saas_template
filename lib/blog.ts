import matter from "gray-matter";

export type Post = {
  slug: string;
  title: string;
  description?: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  content: string;
};

async function readAll(): Promise<Post[]> {
  const { readdir, readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "content", "blog");
  let files: string[] = [];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }
  const posts: Post[] = [];
  for (const f of files) {
    if (!f.endsWith(".mdx") && !f.endsWith(".md")) continue;
    const raw = await readFile(path.join(dir, f), "utf8");
    const { data, content } = matter(raw);
    const slug = f.replace(/\.(mdx?|md)$/, "");
    posts.push({
      slug,
      title: data.title ?? slug,
      description: data.description,
      publishedAt: data.publishedAt ?? new Date().toISOString(),
      updatedAt: data.updatedAt,
      author: data.author,
      content,
    });
  }
  return posts.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getAllPosts(): Promise<Post[]> {
  return readAll();
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const all = await readAll();
  return all.find((p) => p.slug === slug) ?? null;
}
