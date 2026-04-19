import type { Metadata } from "next";

export const metadata: Metadata = { title: "Cookie Policy", alternates: { canonical: "/cookies" } };

export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 prose dark:prose-invert">
      <h1>Cookie Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}.</p>
      <p>Replace this stub with your own cookie policy.</p>
    </div>
  );
}
