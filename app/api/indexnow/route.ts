import { NextResponse } from "next/server";
import { env } from "@/lib/env";

// Triggered on blog publish. Submits URLs to IndexNow (Bing, Yandex, etc.)
export async function POST(req: Request) {
  if (!env.INDEXNOW_KEY) return NextResponse.json({ skipped: true });
  const { urls } = (await req.json()) as { urls: string[] };
  const host = new URL(env.NEXT_PUBLIC_APP_URL).host;
  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host,
      key: env.INDEXNOW_KEY,
      keyLocation: `${env.NEXT_PUBLIC_APP_URL}/${env.INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });
  return NextResponse.json({ status: res.status });
}
