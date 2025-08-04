import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import Stripe from 'stripe'
import { stripe, verifySignature } from './stripeclient.js'
import { jsonResponse } from '../lib/response.js'
import { getClient } from './db-client.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, message: 'Method Not Allowed' })
  }
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

  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
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
          paidThru = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
        }
      } else {
        paidThru = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
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
      break
    }
    case 'invoice.payment_failed': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (!subId) break

      const client = await getClient()
      try {
        await client.query(
          `UPDATE users SET subscription_status = 'expired' WHERE stripe_subscription_id = $1`,
          [subId]
        )
      } finally {
        client.release()
      }
      break
    }
    case 'invoice.paid': {
      const invoice = stripeEvent.data.object as Stripe.Invoice
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
      if (!subId) break
      try {
        const sub = await stripe.subscriptions.retrieve(subId)
        const client = await getClient()
        try {
          await client.query(
            `UPDATE users SET subscription_status = $1, paid_thru_date = to_timestamp($2) WHERE stripe_subscription_id = $3`,
            [sub.status, sub.current_period_end, sub.id]
          )
        } finally {
          client.release()
        }
      } catch (err) {
        console.error('Failed to update invoice.paid', err)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = stripeEvent.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      if (!customerId) return jsonResponse(200, { success: true })

      const client = await getClient()
      try {
        await client.query(
          `UPDATE users
           SET subscription_status = 'canceled',
               paid_thru_date = to_timestamp($1)
           WHERE stripe_subscription_id = $2 OR stripe_customer_id = $3`,
          [sub.current_period_end, sub.id, customerId]
        )
      } finally {
        client.release()
      }
      break
    }
    default:
      break
  }

  return jsonResponse(200, { success: true })
}
