import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { stripe } from './stripeclient.js'
import { jsonResponse } from '../lib/response.js'
import { verifyAuth0Token } from '../lib/auth.js'

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
  let payload
  try {
    payload = await verifyAuth0Token(
      new Request('http://localhost', { headers: event.headers as any })
    )
  } catch (err: any) {
    return jsonResponse(err.statusCode || 401, { success: false, message: 'Unauthorized' })
  }
  const email = (payload.email as string) || ''
  const userId = payload.sub as string
  if (!email) {
    return jsonResponse(400, { success: false, message: 'Missing email' })
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
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/set-password`,
      cancel_url: `${frontendUrl}/purchase`,
      customer_email: email,
      client_reference_id: userId,
      metadata: { userId, email }
    })
    return jsonResponse(200, { success: true, url: session.url })
  } catch (err) {
    console.error('Error creating Stripe checkout session', err)
    return jsonResponse(500, { success: false, message: 'Internal Server Error' })
  }
}
