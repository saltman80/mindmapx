import type { Handler } from '@netlify/functions'
import { getClient } from './db-client'
import { hash } from 'bcrypt'

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

export const handler: Handler = async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD')
    return {
      statusCode: 400,
      body: 'Missing ADMIN_EMAIL or ADMIN_PASSWORD',
    }
  }

  try {
    const client = await getClient()
    const res = await client.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [ADMIN_EMAIL]
    )

    if (res.rows.length > 0) {
      console.log('Admin already exists')
      client.release()
      return {
        statusCode: 200,
        body: 'Admin already exists',
      }
    }

    const passwordHash = await hash(ADMIN_PASSWORD, 10)

    await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
      [ADMIN_EMAIL, passwordHash]
    )
    client.release()

    console.log('Admin user created')
    return {
      statusCode: 200,
      body: 'Admin user created successfully',
    }
  } catch (err: any) {
    console.error('Seeding error:', err)
    return {
      statusCode: 500,
      body: 'Failed to seed admin user',
    }
  }
}
