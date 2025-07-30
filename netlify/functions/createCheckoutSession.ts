import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { stripe } from './stripeclient.js'
import { jsonResponse } from '../lib/response.js'

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
    return jsonResponse(405, { success: false, message: 'Method Not Allowed' })
  }
  if (!event.body) {
    return jsonResponse(400, { success: false, message: 'Missing request body' })
  }
  let data: { email?: string }
  try {
    data = JSON.parse(event.body)
  } catch {
    return jsonResponse(400, { success: false, message: 'Invalid JSON' })
  }
  const email = typeof data.email === 'string' ? data.email.trim() : ''
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email)) {
    return jsonResponse(400, { success: false, message: 'Invalid email' })
  }
  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    console.error('Missing STRIPE_PRICE_ID env var')
    return jsonResponse(500, { success: false, message: 'Configuration error' })
  }
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8888'
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/set-password`,
      cancel_url: `${frontendUrl}/purchase`,
      payment_intent_data: { metadata: { email } }
    })
    return jsonResponse(200, { success: true, url: session.url })
  } catch (err) {
    console.error('Error creating Stripe checkout session', err)
    return jsonResponse(500, { success: false, message: 'Internal Server Error' })
  }
}
