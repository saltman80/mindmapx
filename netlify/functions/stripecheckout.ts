import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import Stripe from 'stripe'
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
}

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    console.error('Missing Stripe secret key')
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Internal server error' }) }
  }
  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' })

  let data: any
  try {
    data = JSON.parse(event.body || '')
  } catch {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Invalid JSON in request body' }) }
  }

  const { items } = data
  if (!Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Request body must include a non-empty items array' }) }
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  for (const [index, item] of items.entries()) {
    if (
      typeof item !== 'object' ||
      typeof item.priceId !== 'string' ||
      !item.priceId ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      !/^price_[A-Za-z0-9]+$/.test(item.priceId)
    ) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: `Invalid item at index ${index}: priceId must start with 'price_' and quantity must be a positive integer` })
      }
    }
    line_items.push({ price: item.priceId, quantity: item.quantity })
  }

  const origin = event.headers.origin || process.env.BASE_URL
  if (!origin) {
    return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Origin header is missing and no BASE_URL is configured' }) }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`
    })
    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ sessionId: session.id, url: session.url }) }
  } catch (err) {
    console.error('Stripe checkout session creation failed:', err)
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}