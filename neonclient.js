const getConnectionString = () => {
  const conn = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
  if (!conn) throw new Error('Database connection string is missing')
  return conn
}

const globalRef = globalThis
if (!globalRef.__neonPool) {
  globalRef.__neonPool = new Pool({
    connectionString: getConnectionString(),
    ssl: { rejectUnauthorized: false },
  })
}

const pool = globalRef.__neonPool

export async function connect() {
  return pool.connect()
}

export async function query(sql, params = []) {
  return pool.query(sql, params)
}

export async function close() {
  await pool.end()
  delete globalRef.__neonPool
}