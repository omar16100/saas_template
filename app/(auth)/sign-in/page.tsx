"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { Turnstile } from "@/components/turnstile";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn.email({ email, password, callbackURL: "/dashboard" });
    setLoading(false);
    if (res.error) setErr(res.error.message ?? "Sign in failed");
    else router.push("/dashboard");
  }

  async function onPasskey() {
    setErr(null);
    const res = await signIn.passkey();
    if (res?.error) setErr(res.error.message ?? "Passkey sign in failed");
    else router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="you@example.com"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder="Password"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Turnstile onVerify={setToken} />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button
          type="submit"
          disabled={loading || !token}
          className="h-10 w-full rounded-md bg-primary text-sm text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <button onClick={onPasskey} className="h-10 w-full rounded-md border text-sm">
        Sign in with passkey
      </button>
      <p className="text-center text-sm text-muted-foreground">
        No account? <Link href="/sign-up" className="underline">Sign up</Link>
      </p>
    </div>
  );
}
