import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { passkey } from "@better-auth/passkey";
import { twoFactor } from "better-auth/plugins/two-factor";
import { magicLink } from "better-auth/plugins";
import { db } from "./db";
import { env } from "./env";
import { describeError, log, logBetterAuthEvent } from "./logger";
import { sendMagicLinkEmail, sendVerifyEmail, sendResetEmail } from "./resend";

const isPreview = env.NEXT_PUBLIC_IS_PREVIEW;
const baseURL = env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL;

// Built per call, never at module load: the D1 binding only exists inside a request
// (getCloudflareContext), and `next build` evaluates route modules outside of one.
export function getAuth() {
  return betterAuth({
    baseURL,
    secret: env.BETTER_AUTH_SECRET,
    logger: { log: logBetterAuthEvent },
    // Unexpected (non-API) errors are rethrown to handleAuthRequest; otherwise better-call prints them
    // raw with console.error, and drizzle query errors carry bound values such as tokens.
    onAPIError: { throw: true },
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

// Handler for app/api/auth/[...all]. API errors already come back as responses; anything else is
// logged without query parameters and answered with a bare 500.
export async function handleAuthRequest(request: Request): Promise<Response> {
  try {
    return await getAuth().handler(request);
  } catch (err) {
    try {
      log.error("auth_request_failed", { error: describeError(err) });
    } catch {
      // The response must not depend on the error being describable.
      log.error("auth_request_failed", { error: "undescribable" });
    }
    return new Response(null, { status: 500 });
  }
}
