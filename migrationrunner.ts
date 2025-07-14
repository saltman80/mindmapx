const MIGRATIONS_TABLE = 'migrations'
let pool: Pool

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
    if (!connectionString) {
      throw new Error('Database connection string not set in DATABASE_URL or NEON_DATABASE_URL')
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })
  }
  return pool
}

function getSqlFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  let files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files = files.concat(getSqlFiles(fullPath))
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.sql') {
      files.push(fullPath)
    }
  }
  return files.sort((a, b) => a.localeCompare(b))
}

async function applyMigration(filePath: string, migrationId: string): Promise<void> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const sql = await fs.promises.readFile(filePath, 'utf-8')
    await client.query('BEGIN')
    await client.query(sql)
    await client.query(`INSERT INTO ${MIGRATIONS_TABLE}(filename) VALUES($1)`, [migrationId])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

async function runMigrations(): Promise<void> {
  const migrationsDir = process.env.MIGRATIONS_DIR || path.resolve(process.cwd(), 'migrations')
  if (!fs.existsSync(migrationsDir) || !fs.statSync(migrationsDir).isDirectory()) {
    console.warn(`Migrations directory not found or is not a directory: ${migrationsDir}`)
    return
  }
  const pool = getPool()
  try {
    const client = await pool.connect()
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
          filename TEXT PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `)
    } finally {
      client.release()
    }
    const files = getSqlFiles(migrationsDir)
    const res = await pool.query(`SELECT filename FROM ${MIGRATIONS_TABLE}`)
    const applied = new Set<string>(res.rows.map(r => r.filename))
    for (const file of files) {
      const migrationId = path.relative(migrationsDir, file)
      if (applied.has(migrationId)) continue
      console.log(`Applying migration: ${migrationId}`)
      await applyMigration(file, migrationId)
      console.log(`Applied migration: ${migrationId}`)
    }
  } finally {
    await pool.end()
  }
}

export { runMigrations, getSqlFiles, applyMigration }