import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { verifyAuth0Token } from '../lib/auth.js'
import { getClient } from './db-client.js'
import { stripe } from './stripeclient.js'
import { jsonResponse } from '../lib/response.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, message: 'Method Not Allowed' })
  }
  try {
    const payload = await verifyAuth0Token(
      new Request(process.env.SITE_URL || 'https://mindxdo.netlify.app', {
        headers: event.headers as any
      })
    )
    const email = payload.email as string
    const client = await getClient()
    try {
      const { rows } = await client.query(
        'SELECT stripe_subscription_id FROM users WHERE email = $1',
        [email.toLowerCase()]
      )
      if (rows.length === 0 || !rows[0].stripe_subscription_id) {
        return jsonResponse(404, { success: false, message: 'Subscription not found' })
      }
      const subscription = await stripe.subscriptions.update(rows[0].stripe_subscription_id, {
        cancel_at_period_end: true
      })
      await client.query(
        `UPDATE users
         SET subscription_status = $1,
             paid_thru_date = to_timestamp($2)
         WHERE email = $3`,
        ['canceled', subscription.current_period_end, email.toLowerCase()]
      )
      return jsonResponse(200, { success: true })
    } finally {
      client.release()
    }
  } catch (err: any) {
    return jsonResponse(err.statusCode || 401, { success: false, message: 'Unauthorized' })
  }
}
