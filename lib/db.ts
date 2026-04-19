import { drizzle } from "drizzle-orm/d1";
import { cfEnv } from "./cf";
import * as schema from "@/db/schema";

export function db() {
  const { DB } = cfEnv();
  return drizzle(DB, { schema });
}

export type DB = ReturnType<typeof db>;
