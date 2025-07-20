import { createCheckoutSession } from './stripeclient.js'
import { getClient } from './db-client.js'
import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getCorsHeaders(origin?: string) {
  const baseUrl = process.env.URL || ""
  let allowedOrigin = ""
  try {
    allowedOrigin = new URL(baseUrl).origin
  } catch {
    // if base URL is invalid, fall back to wildcard but log a warning
    console.warn("Invalid process.env.URL for CORS:", baseUrl)
    allowedOrigin = "*"
  }
  if (origin && origin === allowedOrigin) {
    return {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS"
    }
  }
  // if no origin or mismatch, block or respond with wildcard if base is malformed
  return {
    "Access-Control-Allow-Origin": allowedOrigin === "*" ? "*" : "",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  }
}

export const handler: Handler = async (event) => {
  const corsHeaders = getCorsHeaders(event.headers.origin)
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" }
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method Not Allowed" }
  }

  const client = await getClient()

  let items: Array<{ id: string; quantity: number }>
  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body
    items = body.items
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Invalid items array")
    }
    for (const it of items) {
      if (
        typeof it.id !== "string" ||
        !UUID_V4.test(it.id) ||
        typeof it.quantity !== "number" ||
        !Number.isInteger(it.quantity) ||
        it.quantity < 1
      ) {
        throw new Error("Item validation failed")
      }
    }
  } catch (err) {
    return { statusCode: 400, headers: corsHeaders, body: "Invalid request body or items" }
  }

  const productIds = items.map((it) => it.id)
  let rows: Array<{ id: string; price_id: string }>
  try {
    const res = await client.query("SELECT id, price_id FROM products WHERE id = ANY($1)", [
      productIds
    ])
    rows = res.rows
  } catch (err) {
    console.error("DB query error", err)
    return { statusCode: 500, headers: corsHeaders, body: "Database error" }
  }

  const priceMap: Record<string, string> = {}
  rows.forEach((r) => {
    priceMap[r.id] = r.price_id
  })

  const line_items = items.map((it) => {
    return { price: priceMap[it.id], quantity: it.quantity }
  })
  if (line_items.some((li) => !li.price)) {
    return { statusCode: 400, headers: corsHeaders, body: "One or more items are invalid" }
  }

  const baseUrl = process.env.URL || ""
  try {
    new URL(baseUrl)
  } catch {
    console.error("Invalid base URL:", baseUrl)
    return { statusCode: 500, headers: corsHeaders, body: "Server configuration error" }
  }

  let session
  try {
    session = await createCheckoutSession({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`
    })
  } catch (err) {
    console.error("Stripe session creation error", err)
    return { statusCode: 502, headers: corsHeaders, body: "Payment provider error" }
  }

  // record order in DB within a transaction
  try {
    await client.query("BEGIN")
    await client.query(
      "INSERT INTO orders (session_id, created_at) VALUES ($1, now())",
      [session.id]
    )
    for (const it of items) {
      await client.query(
        "INSERT INTO order_items (order_session_id, product_id, quantity) VALUES ($1, $2, $3)",
        [session.id, it.id, it.quantity]
      )
    }
    await client.query("COMMIT")
  } catch (err) {
    console.error("Failed to record order in DB", err)
    try {
      await client.query("ROLLBACK")
    } catch (rollbackErr) {
      console.error("Rollback failed", rollbackErr)
    }
    return { statusCode: 500, headers: corsHeaders, body: "Failed to record order" }
  } finally {
    client.release()
  }

  return {
    statusCode: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ url: session.url })
  }
}