import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import Stripe from 'stripe'
import { verifySignature } from './stripeclient.js'
import { jsonResponse } from '../lib/response.js'

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
  const email = session.metadata?.email || session.customer_details?.email || session.customer_email
  if (!email) {
    console.warn('Checkout completed but no email found on session')
  } else {
    console.log('Checkout completed for', email)
    // TODO: persist email for matching on /set-password
  }

  return jsonResponse(200, { success: true })
}
