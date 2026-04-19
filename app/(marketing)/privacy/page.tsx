import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}.</p>
      <p>Replace this stub with your own privacy policy.</p>
    </div>
  );
}
