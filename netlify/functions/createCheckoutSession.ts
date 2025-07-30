import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { stripe } from './stripeclient.js'

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ message: 'Method Not Allowed' }) }
  }
  if (!event.body) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ message: 'Missing request body' }) }
  }
  let data: { email?: string }
  try {
    data = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ message: 'Invalid JSON' }) }
  }
  const email = typeof data.email === 'string' ? data.email.trim() : ''
  if (!email) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ message: 'Email is required' }) }
  }
  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    console.error('Missing STRIPE_PRICE_ID env var')
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ message: 'Configuration error' }) }
  }
  const origin = event.headers.origin || process.env.BASE_URL || 'http://localhost:8888'
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/set-password`,
      cancel_url: `${origin}/purchase`,
      payment_intent_data: { metadata: { email } }
    })
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ url: session.url }) }
  } catch (err) {
    console.error('Error creating Stripe checkout session', err)
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ message: 'Internal Server Error' }) }
  }
}
