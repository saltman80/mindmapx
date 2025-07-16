import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
})

export function getClient() {
  return pool.connect()
}

