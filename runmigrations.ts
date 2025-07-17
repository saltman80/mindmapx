import path from 'path'
import { fileURLToPath } from 'url'

import { pool } from './netlify/functions/db-client.js'
import fs from 'fs'

// Execute migration files as a single statement so that dollar quoted
// blocks (e.g. in PL/pgSQL functions) are not split incorrectly.

export async function runMigrations(): Promise<void> {
  const migrationsDir = fileURLToPath(new URL('../migrations', import.meta.url))
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

    // Create base tables in the correct order so later migrations that
    // reference them do not fail on a fresh database.
    await client.query(`
      CREATE TABLE IF NOT EXISTS mindmaps (
        id          UUID PRIMARY KEY,
        title       TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // Ensure the user_id column exists so later migrations that reference it do
    // not fail when creating indexes or constraints.
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'mindmaps' AND column_name = 'user_id'
        ) THEN
          ALTER TABLE mindmaps
            ADD COLUMN user_id UUID;
        END IF;
      END;
      $$;
    `)

    // Ensure the owner_id column exists for older migrations that
    // still reference this column when creating indexes or constraints.
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'mindmaps' AND column_name = 'owner_id'
        ) THEN
          ALTER TABLE mindmaps
            ADD COLUMN owner_id UUID;
        END IF;
      END
      $$;
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS nodes (
        id          UUID PRIMARY KEY,
        mindmap_id  UUID NOT NULL REFERENCES mindmaps(id),
        parent_id   UUID REFERENCES nodes(id),
        content     TEXT NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)

    // Ensure columns used in later indexes exist before index creation. The
    // mindmap_id columns are already created in the SQL migration files, so no
    // additional ALTER TABLE checks are required here.
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
      await client.query('BEGIN')
      try {
        // Run the entire file at once to avoid breaking apart statements that
        // contain semicolons within dollar-quoted blocks.
        await client.query(sql)
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
