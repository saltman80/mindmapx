import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import Stripe from 'stripe'
import { sql } from "@vercel/postgres";
const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
if (!stripeSecret || !stripeWebhookSecret) {
  throw new Error('Missing Stripe environment variables')
}
const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' })

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { Allow: 'POST' }, body: 'Method Not Allowed' }
  }
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  if (!signature) {
    return { statusCode: 400, body: 'Bad Request' }
  }
  let stripeEvent: Stripe.Event
  try {
    const buf = Buffer.from(event.body || '', 'utf8')
    stripeEvent = stripe.webhooks.constructEvent(buf, signature, stripeWebhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed', err)
    return { statusCode: 400, body: 'Webhook Error' }
  }
  const obj = stripeEvent.data.object as Record<string, any>
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = obj as Stripe.Checkout.Session
        const userId = session.client_reference_id
        if (userId) {
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
          const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
          await sql.begin(async (tx) => {
            await tx`
              UPDATE users
              SET stripe_customer_id = ${customerId},
                  stripe_subscription_id = ${subscriptionId},
                  subscription_status = 'active'
              WHERE id = ${userId}
            `
            await tx`
              INSERT INTO payments (user_id, stripe_payment_intent_id, amount, currency, status)
              VALUES (${userId}, ${session.payment_intent}, ${session.amount_total}, ${session.currency}, ${session.payment_status})
              ON CONFLICT (stripe_payment_intent_id) DO NOTHING
            `
          })
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = obj as Stripe.Invoice
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
        let userId: string | undefined
        if (subscriptionId) {
          const res = await sql`SELECT id FROM users WHERE stripe_subscription_id = ${subscriptionId}`
          userId = res.rows[0]?.id
        }
        if (!userId && invoice.customer) {
          const res2 = await sql`SELECT id FROM users WHERE stripe_customer_id = ${invoice.customer as string}`
          userId = res2.rows[0]?.id
        }
        if (userId) {
          await sql`
            INSERT INTO payments (user_id, stripe_invoice_id, amount, currency, status)
            VALUES (${userId}, ${invoice.id}, ${invoice.amount_paid}, ${invoice.currency}, 'paid')
            ON CONFLICT (stripe_invoice_id) DO NOTHING
          `
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = obj as Stripe.Subscription
        await sql`
          UPDATE users
          SET subscription_status = 'canceled'
          WHERE stripe_subscription_id = ${subscription.id}
        `
        break
      }
      default:
        console.log(`Unhandled Stripe event: ${stripeEvent.type}`)
    }
  } catch (err: any) {
    console.error('Error handling Stripe event', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
  return { statusCode: 200, body: JSON.stringify({ received: true }) }
}