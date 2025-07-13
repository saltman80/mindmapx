const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!DATABASE_URL) {
  console.error('Environment variable DATABASE_URL must be defined')
  throw new Error('Environment variable DATABASE_URL must be defined')
}
if (!JWT_SECRET) {
  console.error('Environment variable JWT_SECRET must be defined')
  throw new Error('Environment variable JWT_SECRET must be defined')
}

const pool = new Pool({ connectionString: DATABASE_URL })

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

interface User {
  id: string
  email: string
  role: string
}

class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

async function validateCredentials(email: string, password: string): Promise<User> {
  const client = await pool.connect()
  try {
    const result = await client.query<{
      id: string
      email: string
      password_hash: string
      role: string
    }>(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    )
    if (result.rowCount === 0) {
      throw new AuthError('Invalid email or password')
    }
    const row = result.rows[0]
    const validPassword = await bcrypt.compare(password, row.password_hash)
    if (!validPassword) {
      throw new AuthError('Invalid email or password')
    }
    return { id: row.id, email: row.email, role: row.role }
  } finally {
    client.release()
  }
}

function generateJWT(user: User): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

type AttemptInfo = { count: number; firstAttempt: number }
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_ATTEMPTS = 5
const attemptsMap = new Map<string, AttemptInfo>()

export const handler: Handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Request body is required' }),
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(event.body)
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    }
  }

  const result = loginSchema.safeParse(parsed)
  if (!result.success) {
    const details = result.error.errors.map((e) => e.message)
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid request', details }),
    }
  }

  const { email, password } = result.data
  const ip =
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    event.headers['client-ip'] ||
    'unknown'
  const now = Date.now()
  const record = attemptsMap.get(ip)
  if (record && now - record.firstAttempt < RATE_LIMIT_WINDOW && record.count >= MAX_ATTEMPTS) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ error: 'Too many login attempts. Please try again later.' }),
    }
  }

  try {
    const user = await validateCredentials(email, password)
    const token = generateJWT(user)
    attemptsMap.delete(ip)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token, user }),
    }
  } catch (error: any) {
    if (error instanceof AuthError) {
      const info = attemptsMap.get(ip) || { count: 0, firstAttempt: now }
      if (now - info.firstAttempt < RATE_LIMIT_WINDOW) {
        info.count += 1
      } else {
        info.count = 1
        info.firstAttempt = now
      }
      attemptsMap.set(ip, info)
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: error.message }),
      }
    }
    console.error('Authentication error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}