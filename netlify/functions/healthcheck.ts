import { getClient } from './db-client.js'

const db = getClient()

export const handler: Handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  let dbHealthy = false
  try {
    await db.query('SELECT 1')
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