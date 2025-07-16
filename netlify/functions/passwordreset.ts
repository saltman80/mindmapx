import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { sql } from '@vercel/postgres'
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

export const handler: Handler = async (event, _context) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" }
  }

  try {
    const db = await getClient()
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

      const { rows: userRows } = await db.query(
        sql`SELECT id FROM users WHERE email = ${email}`
      )
      if (userRows.length > 0) {
        const userId = userRows[0].id
        const token = randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
        await db.query(
          sql`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (${userId}, ${token}, ${expiresAt})`
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
        await db.query(sql`BEGIN`)
        const { rows: tokenRows } = await db.query(
          sql`SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = ${token} FOR UPDATE`
        )
        if (
          tokenRows.length === 0 ||
          tokenRows[0].used ||
          new Date(String(tokenRows[0].expires_at)) < new Date()
        ) {
          await db.query(sql`ROLLBACK`)
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Invalid or expired token" }),
          }
        }

        const userId = tokenRows[0].user_id
        const hashedPassword = await bcrypt.hash(password, 10)
        await db.query(
          sql`UPDATE users SET password_hash = ${hashedPassword} WHERE id = ${userId}`
        )
        await db.query(
          sql`UPDATE password_reset_tokens SET used = true WHERE token = ${token}`
        )
        await db.query(sql`COMMIT`)
      } catch (err) {
        await db.query(sql`ROLLBACK`)
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
    } finally {
      db.release()
    }
  } catch (err) {
    console.error("Password reset error:", err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error" }),
    }
  }
}
