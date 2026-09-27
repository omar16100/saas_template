import { toNextJsHandler } from "better-auth/next-js";
import { handleAuthRequest } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(handleAuthRequest);
