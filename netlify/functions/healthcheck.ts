import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import type { Handler } from './types.js'
import { getClient } from './db-client.js'

export const handler: Handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false
  let dbHealthy = false
  try {
    const db = await getClient()
    await db.query('SELECT 1')
    db.release()
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