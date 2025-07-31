import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { jsonResponse } from '../lib/response.js'

const client = jwksClient({
  jwksUri: 'https://dev-8s7m3hg5gjlugoxd.us.auth0.com/.well-known/jwks.json'
})

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid as string, (err, key) => {
    if (err) return callback(err, undefined)
    const signingKey = key.getPublicKey()
    callback(null, signingKey)
  })
}

const verifyToken = (token: string) =>
  new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
        audience: 'https://mindxdo.netlify.app/api',
        issuer: 'https://dev-8s7m3hg5gjlugoxd.us.auth0.com/'
      },
      (err, decoded) => {
        if (err) return reject(err)
        resolve(decoded as jwt.JwtPayload)
      }
    )
  })

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const authHeader = event.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')

  if (!token) {
    return jsonResponse(401, { success: false, message: 'Missing token' })
  }

  try {
    const payload = await verifyToken(token)
    let email = payload.email as string | undefined
    if (!email) {
      const headerEmail = event.headers['x-user-email'] || event.headers['X-User-Email']
      if (headerEmail && typeof headerEmail === 'string') {
        email = headerEmail
      }
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
    return jsonResponse(err.statusCode || 401, {
      success: false,
      message: 'Unauthorized'
    })
  }
}
