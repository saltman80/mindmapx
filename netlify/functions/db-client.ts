import { Pool } from 'pg'

const conn = process.env.NETLIFY_DATABASE_URL
if (!conn) throw new Error('Missing NETLIFY_DATABASE_URL')

export const pool = new Pool({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
})
