// Legacy Drizzle client (tidak digunakan lagi). Aplikasi memakai Supabase client.
// Dibiarkan agar tidak merusak tooling; jangan dipakai bersamaan dengan Supabase.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool = databaseUrl
  ? (globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({ connectionString: databaseUrl }))
  : (undefined as unknown as Pool);

if (databaseUrl && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = databaseUrl ? drizzle(pool) : (undefined as unknown as ReturnType<typeof drizzle>);
