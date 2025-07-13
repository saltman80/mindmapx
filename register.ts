const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable')
}

const SALT_ROUNDS_RAW = process.env.SALT_ROUNDS
if (!SALT_ROUNDS_RAW) {
  throw new Error('Missing SALT_ROUNDS environment variable')
}
const SALT_ROUNDS = Number.parseInt(SALT_ROUNDS_RAW, 10)
if (Number.isNaN(SALT_ROUNDS) || SALT_ROUNDS < 4 || SALT_ROUNDS > 20) {
  throw new Error('Invalid SALT_ROUNDS environment variable, must be integer between 4 and 20')
}

const RegisterSchema = z.object({
  email: z.string().trim().email().transform(e => e.toLowerCase()),
  password: z.string().min(8),
})

type RegisterInput = z.infer<typeof RegisterSchema>

function isPostgresError(err: unknown): err is { code: string } {
  return typeof err === 'object' && err !== null && 'code' in err && typeof (err as any).code === 'string'
}

export const handler: Handler = async (event) => {
  const jsonHeaders = { 'Content-Type': 'application/json' }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...jsonHeaders, Allow: 'POST' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }
  if (!event.body) {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Missing request body' }),
    }
  }
  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(event.body)
  } catch {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Invalid JSON' }),
    }
  }
  const parseResult = RegisterSchema.safeParse(parsedBody)
  if (!parseResult.success) {
    const formattedErrors = parseResult.error.errors.map(err => ({
      field: err.path.join('.') || 'root',
      message: err.message,
    }))
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ errors: formattedErrors }),
    }
  }
  const { email, password } = parseResult.data
  try {
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email])
    if (exists.rowCount > 0) {
      return {
        statusCode: 409,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Email already registered' }),
      }
    }
    const passwordHash = await hash(password, SALT_ROUNDS)
    const result = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash],
    )
    const user = result.rows[0]
    const token = sign(
      { sub: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    )
    return {
      statusCode: 201,
      headers: jsonHeaders,
      body: JSON.stringify({ user, token }),
    }
  } catch (error: unknown) {
    if (isPostgresError(error) && error.code === '23505') {
      return {
        statusCode: 409,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Email already registered' }),
      }
    }
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}