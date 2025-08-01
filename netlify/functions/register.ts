import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import bcrypt from 'bcrypt'

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
  try {
    const {
      NETLIFY_DATABASE_URL,
      BCRYPT_SALT_ROUNDS = '10',
    } = process.env

    if (!NETLIFY_DATABASE_URL) {
      console.error('❌ Missing NETLIFY_DATABASE_URL')
      throw new Error('Missing NETLIFY_DATABASE_URL')
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

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (
      typeof email !== 'string' ||
      !emailRegex.test(email) ||
      typeof password !== 'string' ||
      password.length === 0
    ) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing or invalid email or password' }),
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
      const insertResult = await client.query(
        `INSERT INTO users (email, password_hash, role, created_at, updated_at, trial_start_date, subscription_status)
       VALUES ($1, $2, 'user', now(), now(), now(), 'trialing')
       RETURNING id`,
        [email, passwordHash]
      )
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, id: insertResult.rows[0].id }),
      }
    } finally {
      client.release()
    }
  } catch (err: any) {
    console.error('🔥 Registration failure:', err)
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}


