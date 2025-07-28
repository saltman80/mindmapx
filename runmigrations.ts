import path from 'path'
import { fileURLToPath } from 'url'

import { pool, getClient } from './netlify/functions/db-client.js'
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
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'mindmaps' AND column_name = 'data'
        ) THEN
          ALTER TABLE mindmaps ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
        END IF;
      END;
      $$;
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS nodes (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mindmap_id  UUID NOT NULL REFERENCES mindmaps(id),
        parent_id   UUID REFERENCES nodes(id),
        x           DOUBLE PRECISION DEFAULT 0,
        y           DOUBLE PRECISION DEFAULT 0,
        label       TEXT,
        description TEXT,
        todo_id     UUID REFERENCES todos(id),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE OR REPLACE FUNCTION nodes_update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS nodes_set_updated_at ON nodes;
      CREATE TRIGGER nodes_set_updated_at
        BEFORE UPDATE ON nodes
        FOR EACH ROW EXECUTE PROCEDURE nodes_update_updated_at();

      CREATE INDEX IF NOT EXISTS idx_nodes_mindmap_id ON nodes(mindmap_id);
      CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
      CREATE INDEX IF NOT EXISTS idx_nodes_todo_id ON nodes(todo_id);
    `)

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'nodes' AND column_name = 'id' AND column_default IS NULL
        ) THEN
          ALTER TABLE nodes ALTER COLUMN id SET DEFAULT gen_random_uuid();
        END IF;
      END;
      $$;
    `)

    const { rows: defaultRows } = await client.query(
      `SELECT column_default FROM information_schema.columns WHERE table_name = 'nodes' AND column_name = 'id'`
    )
    console.log('nodes.id default:', defaultRows[0]?.column_default)

    // Drop legacy columns from early experiments
    await client.query(`
      ALTER TABLE nodes DROP COLUMN IF EXISTS position_x;
      ALTER TABLE nodes DROP COLUMN IF EXISTS position_y;
      ALTER TABLE nodes DROP COLUMN IF EXISTS content;
      ALTER TABLE nodes DROP COLUMN IF EXISTS data;
      ALTER TABLE nodes DROP COLUMN IF EXISTS style;
      ALTER TABLE nodes DROP COLUMN IF EXISTS width;
      ALTER TABLE nodes DROP COLUMN IF EXISTS height;
      ALTER TABLE nodes DROP COLUMN IF EXISTS sort_order;
    `)


    // Kanban boards table for task organization
    await client.query(`
      CREATE TABLE IF NOT EXISTS kanban_boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'kanban_boards' AND column_name = 'description'
        ) THEN
          ALTER TABLE kanban_boards ADD COLUMN description TEXT;
        END IF;
      END;
      $$;
    `)

    await client.query(`
      CREATE OR REPLACE FUNCTION trigger_set_boards_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS set_kanban_boards_updated_at ON kanban_boards;
      CREATE TRIGGER set_kanban_boards_updated_at
      BEFORE UPDATE ON kanban_boards
      FOR EACH ROW EXECUTE PROCEDURE trigger_set_boards_updated_at();

      CREATE INDEX IF NOT EXISTS idx_kanban_boards_user_id ON kanban_boards(user_id);
    `)

    // Ensure description column exists on todos
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'todos' AND column_name = 'description'
        ) THEN
          ALTER TABLE todos ADD COLUMN description TEXT;
        END IF;
      END;
      $$;
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
