import type { HandlerEvent, HandlerContext } from '@netlify/functions'

const DOMAIN = process.env.AUTH0_DOMAIN as string
const CLIENT_ID = process.env.AUTH0_CLIENT_ID as string
const CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET as string

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  if (!event.body) {
    return { statusCode: 400, body: 'Missing body' }
  }
  let data: { email?: string; password?: string }
  try {
    data = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }
  const { email, password } = data
  if (!email || !password) {
    return { statusCode: 400, body: 'Email and password required' }
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
      return { statusCode: 500, body: 'Auth0 token error' }
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
      return { statusCode: 201, body: await userRes.text() }
    }
    if (userRes.status === 409) {
      return { statusCode: 409, body: 'User already exists' }
    }
    console.error('Auth0 create user error', await userRes.text())
    return { statusCode: 500, body: 'Auth0 error' }
  } catch (err) {
    console.error('Auth0 user creation failed', err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
