const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
if (!connectionString) throw new Error('Database connection string not provided')
const pool = new Pool({ connectionString, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 })

type QueryParams = { [key: string]: string | undefined; search?: string; status?: string; limit?: string; offset?: string }

interface User { id: string; email: string; name: string; role: string; is_active: boolean; created_at: string; updated_at: string }

async function getUsers(params: QueryParams): Promise<User[]> {
  const filters: string[] = []
  const values: any[] = []
  let idx = 1
  if (params.search) {
    filters.push(`(email ILIKE $${idx} OR name ILIKE $${idx + 1})`)
    values.push(`%${params.search}%`, `%${params.search}%`)
    idx += 2
  }
  if (params.status === 'active') {
    filters.push('is_active = true')
  } else if (params.status === 'inactive') {
    filters.push('is_active = false')
  }
  const rawLimit = parseInt(params.limit || '50', 10)
  const limit = isNaN(rawLimit) ? 50 : Math.min(100, Math.max(1, rawLimit))
  const rawOffset = parseInt(params.offset || '0', 10)
  const offset = isNaN(rawOffset) ? 0 : Math.max(0, rawOffset)
  let query = 'SELECT id, email, name, role, is_active, created_at, updated_at FROM users'
  if (filters.length) query += ' WHERE ' + filters.join(' AND ')
  query += ' ORDER BY created_at DESC'
  query += ` LIMIT $${idx} OFFSET $${idx + 1}`
  values.push(limit, offset)
  const result = await pool.query(query, values)
  return result.rows
}

async function updateUser(userId: string, data: Partial<User>): Promise<User> {
  const allowed: (keyof User)[] = ['email', 'name', 'role', 'is_active']
  const sets: string[] = []
  const values: any[] = []
  let idx = 1
  for (const field of allowed) {
    if ((data as any)[field] !== undefined) {
      sets.push(`${field} = $${idx}`)
      values.push((data as any)[field])
      idx++
    }
  }
  if (!sets.length) {
    const err = new Error('No valid fields to update')
    ;(err as any).statusCode = 400
    throw err
  }
  sets.push('updated_at = NOW()')
  const query = `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING id, email, name, role, is_active, created_at, updated_at`
  values.push(userId)
  const result = await pool.query(query, values)
  if (!result.rowCount) {
    const err = new Error('User not found')
    ;(err as any).statusCode = 404
    throw err
  }
  return result.rows[0]
}

async function deactivateUsers(userIds: string[]): Promise<void> {
  if (!userIds.length) return
  const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ')
  const query = `UPDATE users SET is_active = false, updated_at = NOW() WHERE id IN (${placeholders})`
  await pool.query(query, userIds)
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,PATCH,DELETE,OPTIONS'
  }
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }
  try {
    switch (event.httpMethod) {
      case 'GET': {
        const params = event.queryStringParameters || {}
        if (params.status && !['active', 'inactive'].includes(params.status)) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid status parameter' }) }
        }
        const users = await getUsers(params)
        return { statusCode: 200, headers, body: JSON.stringify(users) }
      }
      case 'PATCH': {
        if (!event.body) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body is required' }) }
        }
        let parsed: any
        try {
          parsed = JSON.parse(event.body)
        } catch {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
        }
        const { userId, data } = parsed
        if (typeof userId !== 'string' || typeof data !== 'object' || data === null) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request payload' }) }
        }
        const updated = await updateUser(userId, data)
        return { statusCode: 200, headers, body: JSON.stringify(updated) }
      }
      case 'DELETE': {
        if (!event.body) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body is required' }) }
        }
        let parsed: any
        try {
          parsed = JSON.parse(event.body)
        } catch {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
        }
        const { userIds } = parsed
        if (!Array.isArray(userIds) || userIds.some(id => typeof id !== 'string')) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid userIds array' }) }
        }
        await deactivateUsers(userIds)
        return { statusCode: 204, headers }
      }
      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) }
    }
  } catch (error: any) {
    console.error(error)
    const statusCode = error.statusCode || 500
    const message = error.message || 'Internal Server Error'
    return { statusCode, headers, body: JSON.stringify({ error: message }) }
  }
}