let pool

export function initClient(connectionString) {
  if (!connectionString) throw new Error('initClient requires a connection string')
  if (!pool) pool = createPool({ connectionString })
  return pool
}

export function getClient() {
  if (!pool) {
    const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
    if (!connectionString) throw new Error('Database client not initialized and no connection string provided')
    pool = createPool({ connectionString })
  }
  return pool
}

export async function query(text, params = []) {
  return getClient().query(text, params)
}