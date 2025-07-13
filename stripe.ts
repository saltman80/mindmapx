const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
if (!stripeSecretKey) throw new Error('Missing STRIPE_SECRET_KEY environment variable')
if (!stripeWebhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')

const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' })

export const handler: Handler = async (event) => {
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature']
  if (!signature) {
    return { statusCode: 400, body: 'Stripe signature missing' }
  }

  let rawBody: Buffer | string = ''
  if (event.isBase64Encoded) {
    rawBody = Buffer.from(event.body || '', 'base64')
  } else {
    rawBody = event.body || ''
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: `Webhook Error: ${err.message}` }
  }

  try {
    switch (stripeEvent.type) {
      case 'charge.succeeded':
        await handleChargeSucceeded(stripeEvent as Stripe.Event<Stripe.Charge>)
        break
      case 'charge.failed':
        await handleChargeFailed(stripeEvent as Stripe.Event<Stripe.Charge>)
        break
      default:
        console.log(`Unhandled Stripe event type: ${stripeEvent.type}`)
    }
  } catch (err) {
    console.error('Error processing Stripe webhook:', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }

  return { statusCode: 200, body: 'Success' }
}

async function handleChargeSucceeded(event: Stripe.Event<Stripe.Charge>): Promise<void> {
  const charge = event.data.object
  const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id
  if (!customerId) {
    console.warn('Charge succeeded event missing customer ID')
    return
  }

  const connection = await client.connect()
  try {
    await connection.query('BEGIN')

    const { rows } = await connection.query(
      'SELECT id FROM users WHERE stripe_customer_id = $1',
      [customerId]
    )
    if (rows.length === 0) {
      console.warn(`No user found for Stripe customer ${customerId}`)
      await connection.query('ROLLBACK')
      return
    }

    const userId = rows[0].id
    await connection.query(
      `INSERT INTO payments (stripe_charge_id, user_id, amount, currency, status, created_at)
       VALUES ($1, $2, $3, $4, $5, to_timestamp($6))
       ON CONFLICT (stripe_charge_id) DO UPDATE SET status = EXCLUDED.status`,
      [charge.id, userId, charge.amount, charge.currency, charge.status, charge.created]
    )
    await connection.query(
      'UPDATE users SET subscription_status = $1 WHERE id = $2',
      ['active', userId]
    )

    await connection.query('COMMIT')
  } catch (error) {
    await connection.query('ROLLBACK')
    throw error
  } finally {
    connection.release()
  }
}

async function handleChargeFailed(event: Stripe.Event<Stripe.Charge>): Promise<void> {
  const charge = event.data.object
  const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id
  if (!customerId) {
    console.warn('Charge failed event missing customer ID')
    return
  }

  const connection = await client.connect()
  try {
    await connection.query('BEGIN')

    const { rows } = await connection.query(
      'SELECT id FROM users WHERE stripe_customer_id = $1',
      [customerId]
    )
    if (rows.length === 0) {
      console.warn(`No user found for Stripe customer ${customerId}`)
      await connection.query('ROLLBACK')
      return
    }

    const userId = rows[0].id
    await connection.query(
      `INSERT INTO payments (stripe_charge_id, user_id, amount, currency, status, created_at)
       VALUES ($1, $2, $3, $4, $5, to_timestamp($6))
       ON CONFLICT (stripe_charge_id) DO UPDATE SET status = EXCLUDED.status`,
      [charge.id, userId, charge.amount, charge.currency, charge.status, charge.created]
    )
    await connection.query(
      'UPDATE users SET subscription_status = $1 WHERE id = $2',
      ['past_due', userId]
    )

    await connection.query('COMMIT')
  } catch (error) {
    await connection.query('ROLLBACK')
    throw error
  } finally {
    connection.release()
  }
}