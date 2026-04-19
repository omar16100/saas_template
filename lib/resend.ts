import { Resend } from "resend";
import { env } from "./env";
import { renderWelcome } from "@/emails/welcome";
import { renderVerify } from "@/emails/verify";
import { renderReset } from "@/emails/reset";
import { renderMagicLink } from "@/emails/magic-link";
import { renderDeletionConfirm } from "@/emails/deletion-confirm";

function client() {
  if (!env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  return new Resend(env.RESEND_API_KEY);
}

function from() {
  return env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
}

export async function sendWelcomeEmail(to: string, name: string) {
  return client().emails.send({
    from: from(),
    to,
    subject: `Welcome to ${env.NEXT_PUBLIC_APP_NAME}`,
    react: renderWelcome({ name, appName: env.NEXT_PUBLIC_APP_NAME }),
  });
}

export async function sendVerifyEmail(to: string, url: string) {
  return client().emails.send({
    from: from(),
    to,
    subject: "Verify your email",
    react: renderVerify({ url, appName: env.NEXT_PUBLIC_APP_NAME }),
  });
}

export async function sendResetEmail(to: string, url: string) {
  return client().emails.send({
    from: from(),
    to,
    subject: "Reset your password",
    react: renderReset({ url, appName: env.NEXT_PUBLIC_APP_NAME }),
  });
}

export async function sendMagicLinkEmail(to: string, url: string) {
  return client().emails.send({
    from: from(),
    to,
    subject: "Your sign-in link",
    react: renderMagicLink({ url, appName: env.NEXT_PUBLIC_APP_NAME }),
  });
}

export async function sendDeletionConfirmEmail(to: string, purgeAt: Date) {
  return client().emails.send({
    from: from(),
    to,
    subject: "Your account is scheduled for deletion",
    react: renderDeletionConfirm({ purgeAt, appName: env.NEXT_PUBLIC_APP_NAME }),
  });
}
