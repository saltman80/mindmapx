import { Pool } from 'pg'

export const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL,
})

export async function getClient() {
  return await pool.connect()
}

