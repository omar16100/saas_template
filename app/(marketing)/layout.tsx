import Link from "next/link";
import { env } from "@/lib/env";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">{env.NEXT_PUBLIC_APP_NAME}</Link>
          <div className="flex gap-6 text-sm">
            <Link href="/pricing">Pricing</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/sign-in">Sign in</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {env.NEXT_PUBLIC_APP_NAME}</span>
          <div className="flex gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookies">Cookies</Link>
            <Link href="/feed.xml">RSS</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
