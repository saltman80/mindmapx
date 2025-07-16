import fs from 'fs'
import path from 'path'
import { pool } from '../netlify/functions/db-client.js'

function splitSql(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt: string) => stmt.trim())
    .filter((stmt: string) => stmt.length)
}

export async function runMigrations(): Promise<void> {
  const migrationsDir = path.resolve(__dirname, '../migrations')
  const client = await pool.connect()
  const LOCK_KEY = 1234567890
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY])
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        run_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    const files = fs.readdirSync(migrationsDir)
      .filter((file: string) => file.endsWith('.sql'))
      .sort((a: string, b: string) => {
        const pa = parseInt(a.split('_')[0], 10)
        const pb = parseInt(b.split('_')[0], 10)
        if (!isNaN(pa) && !isNaN(pb) && pa !== pb) return pa - pb
        return a.localeCompare(b)
      })
    const { rows } = await client.query<{ name: string }>('SELECT name FROM migrations')
    const applied = new Set(rows.map((r: any) => r.name))
    for (const file of files) {
      if (applied.has(file)) continue
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      const statements = splitSql(sql)
      await client.query('BEGIN')
      try {
        for (const stmt of statements) {
          await client.query(stmt)
        }
        await client.query('INSERT INTO migrations(name) VALUES($1)', [file])
        await client.query('COMMIT')
        console.log(`Applied ${file}`)
      } catch (err) {
        try { await client.query('ROLLBACK') } catch {}
        throw err
      }
    }
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]) } catch {}
    client.release()
    await pool.end()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((err: any) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}
