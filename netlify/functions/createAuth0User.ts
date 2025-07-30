import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { jsonResponse } from '../lib/response.js'

const DOMAIN = process.env.AUTH0_DOMAIN as string
const CLIENT_ID = process.env.AUTH0_CLIENT_ID as string
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET as string

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, message: 'Method Not Allowed' })
  }
  if (!event.body) {
    return jsonResponse(400, { success: false, message: 'Missing body' })
  }
  let data: { email?: string; password?: string }
  try {
    data = JSON.parse(event.body)
  } catch {
    return jsonResponse(400, { success: false, message: 'Invalid JSON' })
  }
  const { email, password } = data
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || !emailRegex.test(email) || !password) {
    return jsonResponse(400, { success: false, message: 'Invalid email or password' })
  }

  if (!DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing Auth0 configuration')
    return jsonResponse(500, { success: false, message: 'Configuration error' })
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
      return jsonResponse(500, { success: false, message: 'Auth0 token error' })
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
      return jsonResponse(201, { success: true })
    }
    if (userRes.status === 409) {
      return jsonResponse(409, { success: false, message: 'User already exists' })
    }
    console.error('Auth0 create user error', await userRes.text())
    return jsonResponse(500, { success: false, message: 'Auth0 error' })
  } catch (err) {
    console.error('Auth0 user creation failed', err)
    return jsonResponse(500, { success: false, message: 'Internal Server Error' })
  }
}
