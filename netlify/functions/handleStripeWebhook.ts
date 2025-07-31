import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import Stripe from 'stripe'
import { stripe, verifySignature } from './stripeclient.js'
import { jsonResponse } from '../lib/response.js'
import { getClient } from './db-client.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  if (!signature) {
    return jsonResponse(400, { success: false, message: 'Missing Stripe signature' })
  }
  const payload = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || ''
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = verifySignature(payload, signature)
  } catch (err: any) {
    console.error('Webhook verification failed', err)
    return jsonResponse(400, { success: false, message: 'Invalid signature' })
  }

  if (stripeEvent.type !== 'checkout.session.completed') {
    return jsonResponse(200, { success: true })
  }

  const session = stripeEvent.data.object as Stripe.Checkout.Session
  const userId = (session.metadata?.userId || session.client_reference_id) ?? null
  const email =
    session.metadata?.email || session.customer_details?.email || session.customer_email || null
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : undefined

  let paidThru: number | null = null
  let subStatus = 'active'
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      paidThru = sub.current_period_end
      subStatus = sub.status
    } catch (err) {
      console.error('Failed to fetch subscription', err)
    }
  }

  if (!customerId || (!userId && !email)) {
    console.error('Missing customer ID or user identifier')
    return jsonResponse(200, { success: true })
  }

  const client = await getClient()
  try {
    await client.query(
      `UPDATE users
       SET stripe_customer_id = $1,
           stripe_subscription_id = $2,
           subscription_status = $3,
           paid_thru_date = CASE WHEN $4 IS NOT NULL THEN to_timestamp($4) ELSE NULL END
       WHERE ${(userId ? 'id = $5' : 'email = $5')}`,
      [customerId, subscriptionId, subStatus, paidThru, userId || email!.toLowerCase()]
    )
  } finally {
    client.release()
  }

  return jsonResponse(200, { success: true })
}
