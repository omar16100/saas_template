import { getCloudflareContext } from "@opennextjs/cloudflare";

export function cfEnv() {
  const { env } = getCloudflareContext();
  return env as CloudflareEnv;
}

export function cfCtx() {
  return getCloudflareContext();
}
