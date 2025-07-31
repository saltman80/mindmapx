import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { jsonResponse } from '../lib/response.js'
import { jwtVerify, createRemoteJWKSet } from 'jose'

const ISSUER = process.env.AUTH0_ISSUER!.replace(/\/+$/, '') + '/'
const AUDIENCE = process.env.AUTH0_AUDIENCE!
const jwks = createRemoteJWKSet(new URL(`${ISSUER}.well-known/jwks.json`))

function extractBearerToken(headers: { [key: string]: string | undefined }): string | null {
  const authHeader = headers.authorization || headers.Authorization
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
}

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  try {
    const token = extractBearerToken(event.headers as any)
    if (!token) {
      return jsonResponse(401, { success: false, message: 'Missing token' })
    }

    const { payload } = await jwtVerify(token, jwks, {
      issuer: ISSUER,
      audience: [AUDIENCE, process.env.AUTH0_CLIENT_ID!],
    })

    let email = payload.email as string | undefined
    if (!email) {
      try {
        const infoRes = await fetch(`${ISSUER}userinfo`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (infoRes.ok) {
          const info = (await infoRes.json()) as { email?: string }
          email = info.email
        }
      } catch {
        /* ignore userinfo fetch errors */
      }
    }

    const headerEmail = (event.headers['x-user-email'] || event.headers['X-User-Email']) as string | undefined
    if (!email) {
      email = headerEmail
    }

    if (!email) {
      return jsonResponse(400, { success: false, message: 'Missing email' })
    }

    const client = await getClient()
    try {
      const { rows } = await client.query(
        'SELECT subscription_status, trial_start_date, paid_thru_date FROM users WHERE email = $1',
        [email.toLowerCase()]
      )
      if (rows.length === 0) {
        const insert = await client.query(
          `INSERT INTO users (email, subscription_status, trial_start_date)
           VALUES ($1, 'trialing', now())
           RETURNING subscription_status, trial_start_date, paid_thru_date`,
          [email.toLowerCase()]
        )
        return jsonResponse(200, { success: true, data: insert.rows[0] })
      }

      return jsonResponse(200, { success: true, data: rows[0] })
    } finally {
      client.release()
    }

  } catch (err: any) {
    console.error('Auth error:', err)
    return jsonResponse(err.statusCode || 401, { success: false, message: 'Unauthorized' })
  }
}
