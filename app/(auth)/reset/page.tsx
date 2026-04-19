"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await authClient.forgetPassword({ email, redirectTo: "/reset/confirm" });
    setSent(true);
  }

  if (sent) {
    return <p className="text-sm">Check your email for a reset link.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <input
        type="email"
        required
        placeholder="you@example.com"
        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="h-10 w-full rounded-md bg-primary text-sm text-primary-foreground">
        Send reset link
      </button>
    </form>
  );
}
