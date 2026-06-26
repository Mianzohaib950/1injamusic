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
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalThis.__dbPool;
}

export function getDb() {
  if (!globalThis.__db) {
    globalThis.__db = drizzle(getPool(), { schema });
  }
  return globalThis.__db;
}

export * from "./schema";
