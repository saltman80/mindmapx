import { Pool } from 'pg'

const connectionString =
  process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL

if (!connectionString) {
  throw new Error('Missing DATABASE_URL')
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

export async function getClient() {
  return pool.connect()
}

