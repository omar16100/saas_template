import { env } from "./env";

export async function verifyTurnstile(token: string, ip?: string) {
  if (!env.TURNSTILE_SECRET_KEY) return true; // bypass in dev if not configured
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}
