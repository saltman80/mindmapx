import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import bcrypt from 'bcrypt'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  if (!event.body) {
    return { statusCode: 400, body: 'Missing request body' }
  }
  let data: { userId?: string; password?: string }
  try {
    data = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }
  const { userId, password } = data
  if (!userId || typeof userId !== 'string') {
    return { statusCode: 400, body: 'Invalid userId' }
  }
  if (!password || typeof password !== 'string') {
    return { statusCode: 400, body: 'Invalid password' }
  }
  const hash = await bcrypt.hash(password, 10)
  const client = await getClient()
  try {
    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId])
    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    console.error('set-password error', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  } finally {
    client.release()
  }
}
