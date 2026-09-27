import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import { magicLink } from "better-auth/plugins";
import { db } from "./db";
import { env } from "./env";
import { sendMagicLinkEmail, sendVerifyEmail, sendResetEmail } from "./resend";

const isPreview = env.NEXT_PUBLIC_IS_PREVIEW;
const baseURL = env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL;

// Built per call, never at module load: the D1 binding only exists inside a request
// (getCloudflareContext), and `next build` evaluates route modules outside of one.
export function getAuth() {
  return betterAuth({
    baseURL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
    database: drizzleAdapter(db(), { provider: "sqlite" }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: !isPreview,
      sendResetPassword: async ({ user, url }) => {
        await sendResetEmail(user.email, url);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        await sendVerifyEmail(user.email, url);
      },
    },
    socialProviders: env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    advanced: {
      cookiePrefix: "saas",
      useSecureCookies: !isPreview && env.NEXT_PUBLIC_APP_URL.startsWith("https://"),
    },
    plugins: [
      passkey({
        rpID: env.BETTER_AUTH_RP_ID,
        rpName: env.NEXT_PUBLIC_APP_NAME,
        origin: env.NEXT_PUBLIC_APP_URL,
      }),
      twoFactor(),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url);
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof getAuth>;
export type Session = Auth["$Infer"]["Session"];
