import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { jsonResponse } from '../lib/response.js'
import { getClient } from './db-client.js'

const DOMAIN = process.env.AUTH0_DOMAIN as string
const CLIENT_ID = process.env.AUTH0_CLIENT_ID as string
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET as string

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' })
  }
  if (!event.body) {
    return jsonResponse(400, { success: false, error: 'Missing body' })
  }
  let data: { email?: string; password?: string }
  try {
    data = JSON.parse(event.body)
  } catch {
    return jsonResponse(400, { success: false, error: 'Invalid JSON' })
  }
  const { email, password } = data
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email) || !password) {
    return jsonResponse(400, { success: false, error: 'Invalid email or password' })
  }

  let client
  try {
    client = await getClient()
    const res = await client.query('SELECT has_access FROM user_access WHERE email = $1', [email])
    if (res.rowCount === 0 || !res.rows[0].has_access) {
      return jsonResponse(403, { success: false, error: 'No access for this email' })
    }
  } catch (err) {
    console.error('DB error checking access', err)
    return jsonResponse(500, { success: false, error: 'Internal Server Error' })
  } finally {
    client?.release()
  }

  if (!DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing Auth0 configuration')
    return jsonResponse(500, { success: false, error: 'Configuration error' })
  }

  try {
    const tokenRes = await fetch(`https://${DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        audience: `https://${DOMAIN}/api/v2/`
      })
    })

    if (!tokenRes.ok) {
      console.error('Auth0 token request failed', await tokenRes.text())
      return jsonResponse(500, { success: false, error: 'Auth0 token error' })
    }
    const { access_token } = await tokenRes.json()

    const userRes = await fetch(`https://${DOMAIN}/api/v2/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`
      },
      body: JSON.stringify({
        connection: 'Username-Password-Authentication',
        email,
        password
      })
    })

    if (userRes.status === 201) {
      const created = await userRes.json()
      try {
        const c = await getClient()
        await c.query('UPDATE user_access SET auth0_id=$1 WHERE email=$2', [created.user_id, email])
        c.release()
      } catch (err) {
        console.error('Failed to update user_access for', email, err)
      }
      return jsonResponse(201, { success: true })
    }
    if (userRes.status === 409) {
      return jsonResponse(409, { success: false, error: 'User already exists' })
    }
    console.error('Auth0 create user error', await userRes.text())
    return jsonResponse(500, { success: false, error: 'Auth0 error' })
  } catch (err) {
    console.error('Auth0 user creation failed', err)
    return jsonResponse(500, { success: false, error: 'Internal Server Error' })
  }
}
