import { Pool, PoolClient } from 'pg'

const { DATABASE_URL: LOCAL_DB, NETLIFY_DATABASE_URL } = process.env
const connectionString = LOCAL_DB || NETLIFY_DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL')
}

console.info(
  `db-client using ${LOCAL_DB ? 'DATABASE_URL' : 'NETLIFY_DATABASE_URL'} connection`
)

export const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}
