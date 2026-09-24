import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __richItDb?: Database; __richItSql?: postgres.Sql };

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill in your Supabase connection string.");
  }
  const client =
    globalForDb.__richItSql ??
    postgres(url, {
      prepare: false, // required for Supabase transaction pooler (pgbouncer)
      max: process.env.NODE_ENV === "production" ? 10 : 3,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  if (process.env.NODE_ENV !== "production") globalForDb.__richItSql = client;
  return drizzle(client, { schema });
}

/** Lazily-initialised singleton so `next build` does not require a database. */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = globalForDb.__richItDb ?? (globalForDb.__richItDb = createDb());
    const value = Reflect.get(instance, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
