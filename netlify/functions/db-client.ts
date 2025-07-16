import { Pool } from 'pg'

const conn = process.env.NETLIFY_DATABASE_URL_UNPOOLED
if (!conn) throw new Error('Missing NETLIFY_DATABASE_URL_UNPOOLED')

export const pool = new Pool({
  connectionString: conn,
  ssl: { rejectUnauthorized: false },
})
