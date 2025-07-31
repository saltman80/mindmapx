import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// Database connection is handled in db-client.ts

const allowedOrigin = process.env.CORS_ORIGIN || '*'
const corsHeaders = {
  'Access-Control-Allow-Origin': allowedOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
}

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  const {
    NETLIFY_DATABASE_URL,
    JWT_SECRET,
    BCRYPT_SALT_ROUNDS = '10',
    SESSION_EXPIRY_HOURS = '24',
  } = process.env

  if (!NETLIFY_DATABASE_URL) {
    console.error('❌ Missing NETLIFY_DATABASE_URL')
    throw new Error('Missing NETLIFY_DATABASE_URL')
  }
  if (!JWT_SECRET) {
    console.error('❌ Missing JWT_SECRET')
    throw new Error('Missing JWT_SECRET')
  }
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    }
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...corsHeaders, Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }
  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid request body' }),
    }
  }

  const { email, password } = body as any

  if (!email || !password) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Missing email or password' }),
    }
  }
  const client = await getClient()
  try {
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    const count = existingUser.rowCount ?? 0
    if (count > 0) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email already registered' }),
      }
    }
    const passwordHash = await bcrypt.hash(
      password,
      parseInt(BCRYPT_SALT_ROUNDS)
    )
    const result = await client.query(
      `INSERT INTO users (email, password_hash, subscription_status, trial_start_date)
       VALUES ($1, $2, 'trialing', now())
       RETURNING id`,
      [email, passwordHash]
    )
    const newUserId = result.rows[0].id
    const token = jwt.sign(
      { userId: newUserId },
      JWT_SECRET as string,
      { expiresIn: `${SESSION_EXPIRY_HOURS}h` }
    )
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({ token }),
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  } finally {
    client.release()
  }
}


