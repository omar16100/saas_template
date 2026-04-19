import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}.</p>
      <p>Replace this stub with your own terms.</p>
    </div>
  );
}
