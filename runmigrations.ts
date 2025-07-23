import path from 'path'
import { fileURLToPath } from 'url'

import { pool, getClient } from './netlify/functions/db-client'
import fs from 'fs'
import bcrypt from 'bcrypt'

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

    // Ensure title and description columns exist for map metadata
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'mindmaps' AND column_name = 'title'
        ) THEN
          ALTER TABLE mindmaps ADD COLUMN title TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'mindmaps' AND column_name = 'description'
        ) THEN
          ALTER TABLE mindmaps ADD COLUMN description TEXT;
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
      if (applied.has(file)) {
        console.log(`[skip] Migration already applied: ${file}`)
        continue
      }
      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf8')
      console.log(`🟡 Starting migration: ${file}`)

      await client.query('BEGIN')
      try {
        console.log(`🟡 Running SQL from file: ${file}`)
        console.log(sql)
        await client.query(sql)
        await client.query('INSERT INTO migrations(name) VALUES($1)', [file])
        await client.query('COMMIT')
        console.log(`✅ Successfully applied: ${file}`)
      } catch (err: any) {
        await client.query('ROLLBACK').catch(() => {})
        console.error(`❌ Migration failed in file: ${file}`)
        console.error(`🔴 Error message: ${err.message}`)
        console.error(`📝 First few lines of SQL:\n${sql.slice(0, 300)}...`)
        throw err
      }
    }
  } finally {
    try { await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]) } catch {}
    client.release()
    try {
      await seedAdminUser()
    } catch (err) {
      console.error('Admin user seeding failed:', err)
    }
    await pool.end()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((err: any) => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
}

async function seedAdminUser() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '10', 10)

  console.info(
    `seeding admin user using ${ADMIN_EMAIL && ADMIN_PASSWORD ? 'provided credentials' : 'no credentials'}`
  )

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('Skipping admin user seed: ADMIN_EMAIL or ADMIN_PASSWORD missing')
    return
  }

  const db = await getClient()
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL])
  if (existing.rows.length > 0) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`)
    db.release()
    return
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)
  await db.query(
    `INSERT INTO users (email, password_hash, role, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [ADMIN_EMAIL, passwordHash, 'admin']
  )
  db.release()

  console.log(`✅ Admin user seeded: ${ADMIN_EMAIL}`)
}
