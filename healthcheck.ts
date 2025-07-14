let pool: Pool | undefined = undefined

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.NEON_DATABASE_URL
    if (!connectionString) {
      throw new Error('NEON_DATABASE_URL environment variable is not set')
    }
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    })
  }
  return pool
}

export const handler: Handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  let dbHealthy = false
  try {
    await getPool().query('SELECT 1')
    dbHealthy = true
  } catch (error) {
    console.error('Healthcheck DB error:', error)
  }
  const statusCode = dbHealthy ? 200 : 500
  const payload = { status: dbHealthy ? 'ok' : 'error', db: dbHealthy }
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    },
    body: JSON.stringify(payload)
  }
}