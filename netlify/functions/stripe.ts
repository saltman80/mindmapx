import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { verifySignature } from '../../stripeclient.js'
import Stripe from 'stripe'
import type { Client } from 'pg'
const stripeSecret = process.env.STRIPE_SECRET_KEY
if (!stripeSecret) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable.')
}
const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' })

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
if (!webhookSecret) {
  throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable.')
}

const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
if (!connectionString) {
  throw new Error('Missing DATABASE_URL or NEON_DATABASE_URL environment variable.')
}

declare global {
  // eslint-disable-next-line no-var
  var _dbClient: Client | undefined
}

import { getClient } from './db-client.js'
const db: Client = getClient()

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  if (!sig) {
    return { statusCode: 400, body: 'Missing Stripe signature header.' }
  }
  if (!event.body) {
    return { statusCode: 400, body: 'Missing request body.' }
  }

  let stripeEvent: Stripe.Event
  try {
    const payload = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body
    stripeEvent = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    const insertResult = await db.query(
      'INSERT INTO stripe_events(id, type, created_at) VALUES($1, $2, to_timestamp($3)) ON CONFLICT(id) DO NOTHING',
      [stripeEvent.id, stripeEvent.type, stripeEvent.created]
    )
    if (insertResult.rowCount === 0) {
      console.log(`Duplicate event ${stripeEvent.id} of type ${stripeEvent.type} skipped.`)
      return { statusCode: 200, body: 'OK' }
    }
  } catch (err) {
    console.error('Error during idempotency check', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id
        const subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : undefined
        const userId = session.metadata?.userId || session.client_reference_id
        if (customerId && userId) {
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            await db.query(
              `UPDATE users
               SET stripe_customer_id = $1,
                   stripe_subscription_id = $2,
                   subscription_status = $3,
                   subscription_current_period_end = to_timestamp($4)
               WHERE id = $5`,
              [
                customerId,
                subscription.id,
                subscription.status,
                subscription.current_period_end,
                userId
              ]
            )
          } else {
            await db.query(
              `UPDATE users
               SET stripe_customer_id = $1
               WHERE id = $2`,
              [customerId, userId]
            )
          }
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        let subscription: Stripe.Subscription
        if (stripeEvent.type.startsWith('invoice')) {
          const invoice = stripeEvent.data.object as Stripe.Invoice
          if (!invoice.subscription) break
          subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        } else {
          subscription = stripeEvent.data.object as Stripe.Subscription
        }
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id
        if (!customerId) break
        await db.query(
          `UPDATE users
           SET stripe_subscription_id = $1,
               subscription_status = $2,
               subscription_current_period_end = CASE WHEN $3 IS NOT NULL THEN to_timestamp($3) ELSE NULL END
           WHERE stripe_customer_id = $4`,
          [
            subscription.id,
            subscription.status,
            subscription.current_period_end,
            customerId
          ]
        )
        break
      }
      default:
        console.log(`Unhandled Stripe event type ${stripeEvent.type}`)
    }
  } catch (err) {
    console.error('Error handling Stripe event', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }

  return { statusCode: 200, body: 'OK' }
}