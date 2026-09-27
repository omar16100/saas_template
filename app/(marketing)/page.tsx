import Link from "next/link";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20">
      <section className="space-y-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">{env.NEXT_PUBLIC_APP_NAME}</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          A Cloudflare-first SaaS starter. Replace this copy with your product&apos;s value proposition.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild size="lg"><Link href="/sign-up">Get started</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/pricing">See pricing</Link></Button>
        </div>
      </section>
    </div>
  );
}
