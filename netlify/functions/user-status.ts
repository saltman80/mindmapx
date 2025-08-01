import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { jsonResponse } from '../lib/response.js'
import { extractToken, verifySession } from './auth.js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase()

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  try {
    const token = extractToken(event)
    if (!token) {
      return jsonResponse(401, { success: false, message: 'Unauthorized' })
    }

    const payload = await verifySession(token)
    const userEmail = payload.email?.toLowerCase()

    if (payload.role === 'admin' || userEmail === ADMIN_EMAIL) {
      return jsonResponse(200, {
        success: true,
        data: {
          subscription_status: 'active',
          trial_start_date: null,
          paid_thru_date: null,
          role: 'admin'
        }
      })
    }

    if (!userEmail) {
      return jsonResponse(400, { success: false, message: 'Missing email' })
    }

    const client = await getClient()
    try {
      const { rows } = await client.query(
        'SELECT subscription_status, trial_start_date, paid_thru_date FROM users WHERE email = $1',
        [userEmail]
      )
      if (rows.length === 0) {
        const insert = await client.query(
          `INSERT INTO users (email, subscription_status, trial_start_date)
           VALUES ($1, 'trialing', now())
           RETURNING subscription_status, trial_start_date, paid_thru_date`,
          [userEmail]
        )
        return jsonResponse(200, { success: true, data: insert.rows[0] })
      }

      const user = rows[0]
      const now = Date.now()
      let status = user.subscription_status
      if (user.paid_thru_date && new Date(user.paid_thru_date).getTime() > now) {
        status = 'active'
      } else if (
        user.trial_start_date &&
        new Date(user.trial_start_date).getTime() + 3 * 24 * 60 * 60 * 1000 < now
      ) {
        status = 'expired'
      }

      if (status !== user.subscription_status) {
        const update = await client.query(
          `UPDATE users SET subscription_status = $1 WHERE email = $2 RETURNING subscription_status, trial_start_date, paid_thru_date`,
          [status, userEmail]
        )
        return jsonResponse(200, { success: true, data: update.rows[0] })
      }

      return jsonResponse(200, { success: true, data: user })
    } finally {
      client.release()
    }

  } catch (err: any) {
    console.error('Auth error:', err)
    return jsonResponse(err.statusCode || 401, { success: false, message: 'Unauthorized' })
  }
}
