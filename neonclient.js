let pool

export function connect(connectionString) {
  if (!globalThis.__pgPool) {
    globalThis.__pgPool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })
  }
  pool = globalThis.__pgPool
  return pool
}

export async function query(text, params = []) {
  if (!pool) {
    throw new Error('Database not connected. Call connect(connectionString) first.')
  }
  return pool.query(text, params)
}

export async function close() {
  if (globalThis.__pgPool) {
    await globalThis.__pgPool.end()
    globalThis.__pgPool = null
    pool = null
  }
}