const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('Environment variable DATABASE_URL must be defined')
}

const pool: Pool = createPool({ connectionString: databaseUrl })

const allowedOrigin = process.env.ALLOWED_ORIGIN
if (!allowedOrigin) {
  throw new Error('Environment variable ALLOWED_ORIGIN must be defined')
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  context.callbackWaitsForEmptyEventLoop = false

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...headers, Allow: 'GET, OPTIONS' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    await pool.query('SELECT 1')
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'ok', db: 'ok' })
    }
  } catch (error) {
    console.error('Healthcheck DB error:', error)
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ status: 'error', db: 'unavailable' })
    }
  }
}