import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getClient } from './netlify/functions/db-client.js'

async function runMigrations() {
  const client = await getClient()
  console.log(
    '\uD83D\uDD27 Running migrations against DB:',
    (client as any).connectionParameters.database
  )

  // Create migrations table if missing
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)

  const migrationsDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../migrations'
  )

  if (!fs.existsSync(migrationsDir)) {
    console.warn(`Migrations directory not found at ${migrationsDir}`)
    await client.release()
    return
  }

  // Load and sort migration files
  const files = fs
    .readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const already = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file])
    if (already.rowCount > 0) {
      console.log(`⬜ Skipping ${file} (already applied)`)
      continue
    }

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
      process.exit(1)
    }
  }

  await client.release()
}

runMigrations().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
