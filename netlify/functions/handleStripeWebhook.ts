import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import Stripe from 'stripe'
import { verifySignature } from './stripeclient.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  if (!signature) {
    return { statusCode: 400, body: 'Missing Stripe signature' }
  }
  const payload = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || ''
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = verifySignature(payload, signature)
  } catch (err: any) {
    console.error('Webhook verification failed', err)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const email = session.metadata?.email || session.customer_details?.email || session.customer_email
    console.log('Checkout completed for', email)
    // TODO: persist email for matching on /set-password
  }

  return { statusCode: 200, body: 'ok' }
}
