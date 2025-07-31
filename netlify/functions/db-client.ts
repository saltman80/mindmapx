import { Pool as PgPool, PoolClient } from 'pg'

const { NETLIFY_DATABASE_URL } = process.env

if (!NETLIFY_DATABASE_URL) {
  throw new Error('Missing NETLIFY_DATABASE_URL')
}

console.info('db-client using NETLIFY_DATABASE_URL connection')

export const pool = new PgPool({
  connectionString: NETLIFY_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}
