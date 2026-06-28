import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __db: any | undefined;
}

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set.");
  }
  return connectionString;
}

function shouldUseSsl(connectionString: string) {
  return !(
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1")
  );
}

export function getPool() {
  if (!globalThis.__dbPool) {
    const connectionString = getConnectionString();
    globalThis.__dbPool = new Pool({
      connectionString,
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      keepAlive: true,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__dbPool;
}

export async function resetDbConnection() {
  const pool = globalThis.__dbPool;
  globalThis.__dbPool = undefined;
  globalThis.__db = undefined;
  if (!pool) return;
  try {
    await pool.end();
  } catch {
    // Ignore cleanup errors; the next request will create a fresh pool.
  }
}

export function getDb() {
  if (!globalThis.__db) {
    globalThis.__db = drizzle(getPool(), { schema });
  }
  return globalThis.__db;
}

export * from "./schema";
