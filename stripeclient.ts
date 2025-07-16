import Stripe from 'stripe'
import { randomUUID } from 'crypto'

let stripeInstance: Stripe | null = null
let webhookSecretVal: string | null = null

function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    stripeInstance = new Stripe(key, { apiVersion: '2022-11-15', typescript: true })
  }
  return stripeInstance
}

function getWebhookSecret(): string {
  if (!webhookSecretVal) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    webhookSecretVal = secret
  }
  return webhookSecretVal
}

const allowedEventTypes = ['checkout.session.completed', 'invoice.payment_failed'] as const

export function verifySignature(payload: string, signature: string): Stripe.Event {
  try {
    const stripe = getStripeClient()
    const secret = getWebhookSecret()
    const event = stripe.webhooks.constructEvent(payload, signature, secret)
    if (!allowedEventTypes.includes(event.type as any)) {
      throw new Error(`Unexpected event type: ${event.type}`)
    }
    return event
  } catch (err) {
    throw new Error(
      `Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err as Error }
    )
  }
}

export async function createCheckoutSession(
  params: Stripe.Checkout.SessionCreateParams,
  idempotencyKey?: string
): Promise<Stripe.Checkout.Session> {
  try {
    const stripe = getStripeClient()
    const key = idempotencyKey ?? randomUUID()
    return await stripe.checkout.sessions.create(params, { idempotencyKey: key })
  } catch (err) {
    throw new Error(
      `Failed to create checkout session: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err as Error }
    )
  }
}
import Stripe from 'stripe'
import { randomUUID } from 'crypto'