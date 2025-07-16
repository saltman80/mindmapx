import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15'
})

export function verifySignature(payload: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET as string
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

export function createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
  return stripe.checkout.sessions.create(params)
}
