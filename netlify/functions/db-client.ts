import { Pool as PgPool, PoolClient } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { NETLIFY_DATABASE_URL } = process.env

if (!NETLIFY_DATABASE_URL) {
  throw new Error('Missing NETLIFY_DATABASE_URL')
}

console.info('db-client using NETLIFY_DATABASE_URL connection')

export const pool = new PgPool({
  connectionString: NETLIFY_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

let migrationPromise: Promise<void> | null = null

async function runMigrations() {
  const migrationsDir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../../migrations'
  )

  if (!fs.existsSync(migrationsDir)) {
    console.warn(`Migrations directory not found at ${migrationsDir}`)
    return
  }

  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

    for (const file of files) {
      const already = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file])
      if (already.rowCount > 0) continue

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query(`INSERT INTO schema_migrations (version) VALUES ($1)`, [file])
        await client.query('COMMIT')
        console.log(`✅ Applied ${file}`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`❌ Error applying ${file}:`, err)
        throw err
      }
    }
  } finally {
    client.release()
  }
}

export async function getClient(): Promise<PoolClient> {
  if (!migrationPromise) {
    migrationPromise = runMigrations()
  }
  await migrationPromise
  return pool.connect()
}
