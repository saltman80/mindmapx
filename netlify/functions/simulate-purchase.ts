import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  if (!event.body) {
    return { statusCode: 400, body: 'Missing request body' }
  }
  let data: { name?: string; email?: string }
  try {
    data = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  if (!email) {
    return { statusCode: 400, body: 'Email is required' }
  }
  const name = typeof data.name === 'string' ? data.name : null
  const client = await getClient()
  try {
    const tempPassword = randomUUID()
    const passwordHash = await bcrypt.hash(tempPassword, 10)
    const userRes = await client.query(
      'INSERT INTO users (email, password_hash, name, subscription_status) VALUES ($1,$2,$3,$4) RETURNING id',
      [email, passwordHash, name, 'active']
    )
    const userId = userRes.rows[0].id as string
    await client.query(
      'INSERT INTO payments (user_id, amount, currency, payment_provider, provider_payment_id, status) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, 795, 'USD', 'simulated', randomUUID(), 'completed']
    )
    return { statusCode: 200, body: JSON.stringify({ userId }) }
  } catch (err) {
    console.error('simulate-purchase error', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  } finally {
    client.release()
  }
}
