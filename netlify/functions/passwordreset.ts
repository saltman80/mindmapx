import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'

import { randomBytes } from 'crypto'

const SITE_URL = process.env.SITE_URL
if (!SITE_URL) {
  console.error("Missing required SITE_URL environment variable")
  throw new Error("Missing required SITE_URL environment variable")
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 5

declare global {
  var resetRateLimitMap: Map<string, { count: number; windowStart: number }>
}
if (!global.resetRateLimitMap) {
  global.resetRateLimitMap = new Map()
}
import bcrypt from 'bcrypt'
import { z } from 'zod'

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
  "Content-Type": "application/json",
}

export const handler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" }
  }

  const client = await getClient()
  try {
      if (event.httpMethod === "POST") {
      let parsedBody: any
      try {
        parsedBody = JSON.parse(event.body || "{}")
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Malformed JSON" }),
        }
      }

      const emailSchema = z.object({ email: z.string().email() })
      const parseResult = emailSchema.safeParse(parsedBody)
      if (!parseResult.success) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid email address" }),
        }
      }

      const email = parseResult.data.email.toLowerCase().trim()
      const ip =
        event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        event.headers["client-ip"] ||
        "unknown"
      const now = Date.now()
      const rl = global.resetRateLimitMap.get(ip) || {
        count: 0,
        windowStart: now,
      }
      if (now - rl.windowStart > RATE_LIMIT_WINDOW_MS) {
        rl.count = 0
        rl.windowStart = now
      }
      if (rl.count >= RATE_LIMIT_MAX) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ error: "Too many requests, please try later" }),
        }
      }
      rl.count++
      global.resetRateLimitMap.set(ip, rl)

      const { rows } = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )
      if (rows.length > 0) {
        const userId = rows[0].id
        const token = randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
        await client.query(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
          [userId, token, expiresAt]
        )
        const resetLink = `${SITE_URL}/reset-password?token=${token}`
        const html = `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message:
            "If a user with that email exists, a password reset link has been sent.",
        }),
      }
    } else if (event.httpMethod === "PUT") {
      let parsedBody: any
      try {
        parsedBody = JSON.parse(event.body || "{}")
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Malformed JSON" }),
        }
      }

      const schema = z.object({
        token: z.string(),
        password: z.string().min(8),
      })
      const parseResult = schema.safeParse(parsedBody)
      if (!parseResult.success) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid request data" }),
        }
      }

      const { token, password } = parseResult.data

      // start transaction for atomic check-and-update with row lock
      try {
        await client.query('BEGIN')
        const { rows } = await client.query(
          'SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = $1 FOR UPDATE',
          [token]
        )
        if (
          rows.length === 0 ||
          rows[0].used ||
          new Date(String(rows[0].expires_at)) < new Date()
        ) {
          await client.query('ROLLBACK')
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Invalid or expired token" }),
          }
        }

        const userId = rows[0].user_id
        const hashedPassword = await bcrypt.hash(password, 10)
        await client.query(
          'UPDATE users SET password_hash = $1 WHERE id = $2',
          [hashedPassword, userId]
        )
        await client.query(
          'UPDATE password_reset_tokens SET used = true WHERE token = $1',
          [token]
        )
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: "Password has been reset successfully.",
        }),
      }
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      }
    }
  } catch (err) {
    console.error("Password reset error:", err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }
  } finally {
    client.release()
  }
}
