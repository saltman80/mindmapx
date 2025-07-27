import { Pool as PgPool, PoolClient } from 'pg'
import { Pool as NeonPool } from '@neondatabase/serverless'

const { DATABASE_URL: LOCAL_DB, NETLIFY_DATABASE_URL, NEON_DATABASE_URL } = process.env
const connectionString = LOCAL_DB || NETLIFY_DATABASE_URL || NEON_DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL')
}

const source = LOCAL_DB
  ? 'DATABASE_URL'
  : NETLIFY_DATABASE_URL
    ? 'NETLIFY_DATABASE_URL'
    : 'NEON_DATABASE_URL'
console.info(`db-client using ${source} connection`)

const useNeon = !!NEON_DATABASE_URL && !LOCAL_DB

export const pool = useNeon
  ? new NeonPool({ connectionString })
  : new PgPool({
      connectionString,
      ssl:
        process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    })

export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}
