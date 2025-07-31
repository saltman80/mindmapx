import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { verifyAuth0Token } from '../lib/auth.js'
import { jsonResponse } from '../lib/response.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  try {
    const payload = await verifyAuth0Token(
      new Request('http://localhost', { headers: event.headers as any })
    )
    const email = payload.email as string
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
