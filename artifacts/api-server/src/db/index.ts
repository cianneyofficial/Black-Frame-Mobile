import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL ?? '';

export function getPgPool(): Pool | null {
  if (!connectionString) return null;
  return new Pool({ connectionString });
}

export function getDb() {
  const pool = getPgPool();
  if (!pool) throw new Error('DATABASE_URL not configured');
  return drizzle(pool);
}
