"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Turnstile } from "@/components/turnstile";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signUp.email({ email, password, name, callbackURL: "/dashboard" });
    setLoading(false);
    if (res.error) setErr(res.error.message ?? "Sign up failed");
    else router.push("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create account</h1>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          required
          placeholder="Name"
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          minLength={8}
          placeholder="Password (min 8 chars)"
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
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Have an account? <Link href="/sign-in" className="underline">Sign in</Link>
      </p>
    </div>
  );
}
