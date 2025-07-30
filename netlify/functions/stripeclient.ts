import Stripe from 'stripe'

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(secretKey, { apiVersion: '2022-11-15' })

export function verifySignature(payload: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET')
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

export function createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
  return stripe.checkout.sessions.create(params)
}
