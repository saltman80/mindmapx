const connectionString = process.env.DATABASE_URL ?? process.env.NEON_DATABASE_URL ?? process.env.NEON_URL
if (!connectionString) {
  throw new Error('Database connection string is not set in environment variables')
}

const ssl = process.env.NODE_ENV === 'production'
  ? { rejectUnauthorized: true }
  : { rejectUnauthorized: false }

const globalWithPG = globalThis as typeof globalThis & { pgPool?: Pool }
const pool = globalWithPG.pgPool ?? new Pool({ connectionString, ssl })
if (!globalWithPG.pgPool) globalWithPG.pgPool = pool

type Payment = {
  id: string
  userId: string
  amount: number
  currency: string
  status: string
  createdAt: string
  updatedAt: string
}

type QueryParams = {
  page: number
  pageSize: number
  status?: string
  userId?: string
  startDate?: string
  endDate?: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const validSortFields = ['created_at', 'amount', 'status', 'updated_at']
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS }
  }
  const headers = { ...CORS_HEADERS, 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...headers, Allow: 'GET' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  try {
    const qs = event.queryStringParameters ?? {}
    const paymentId = qs.id ?? qs.paymentId
    if (paymentId) {
      if (!/^[0-9a-fA-F\-]+$/.test(paymentId)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request', message: 'Invalid paymentId' }) }
      }
      const payment = await getPaymentDetails(paymentId)
      if (!payment) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: 'Payment Not Found' }) }
      }
      return { statusCode: 200, headers, body: JSON.stringify(payment) }
    }

    const rawPage = qs.page
    const rawPageSize = qs.pageSize
    let page = 1
    let pageSize = 20
    if (rawPage !== undefined) {
      const p = parseInt(rawPage, 10)
      if (isNaN(p) || p < 1) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request', message: 'Invalid page parameter' }) }
      }
      page = p
    }
    if (rawPageSize !== undefined) {
      const ps = parseInt(rawPageSize, 10)
      if (isNaN(ps) || ps < 1 || ps > 100) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request', message: 'Invalid pageSize parameter' }) }
      }
      pageSize = ps
    }

    const { status, userId, startDate: rawStartDate, endDate: rawEndDate, sortBy: rawSortBy, sortOrder: rawSortOrder } = qs
    let startDate: string | undefined
    let endDate: string | undefined
    if (rawStartDate !== undefined) {
      if (isNaN(Date.parse(rawStartDate))) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request', message: 'Invalid startDate parameter' }) }
      }
      startDate = rawStartDate
    }
    if (rawEndDate !== undefined) {
      if (isNaN(Date.parse(rawEndDate))) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request', message: 'Invalid endDate parameter' }) }
      }
      endDate = rawEndDate
    }

    let sortBy = rawSortBy ?? 'created_at'
    if (!validSortFields.includes(sortBy)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request', message: 'Invalid sortBy parameter' }) }
    }
    let sortOrder: 'asc' | 'desc' = 'desc'
    if (rawSortOrder !== undefined) {
      if (rawSortOrder !== 'asc' && rawSortOrder !== 'desc') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Bad Request', message: 'Invalid sortOrder parameter' }) }
      }
      sortOrder = rawSortOrder
    }

    const params: QueryParams = { page, pageSize, status, userId, startDate, endDate, sortBy, sortOrder }
    const { items, totalCount } = await getPayments(params)
    const totalPages = Math.ceil(totalCount / pageSize)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ items, pagination: { totalCount, totalPages, currentPage: page, pageSize } }),
    }
  } catch (error) {
    console.error('Error in payments handler:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }
  }
}

async function getPayments(params: QueryParams): Promise<{ items: Payment[]; totalCount: number }> {
  const { page, pageSize, status, userId, startDate, endDate, sortBy, sortOrder } = params
  const conditions: string[] = []
  const values: any[] = []

  if (status) {
    values.push(status)
    conditions.push(`status = $${values.length}`)
  }
  if (userId) {
    values.push(userId)
    conditions.push(`user_id = $${values.length}`)
  }
  if (startDate) {
    values.push(startDate)
    conditions.push(`created_at >= $${values.length}`)
  }
  if (endDate) {
    values.push(endDate)
    conditions.push(`created_at <= $${values.length}`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const countQuery = `SELECT COUNT(*) AS count FROM payments ${whereClause}`
  const countResult = await pool.query(countQuery, values)
  const totalCount = parseInt(countResult.rows[0].count, 10)

  const offset = (page - 1) * pageSize
  const dataValues = [...values, pageSize, offset]
  const dataQuery = `
    SELECT
      id,
      user_id AS "userId",
      amount,
      currency,
      status,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM payments
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
    LIMIT $${dataValues.length - 1}
    OFFSET $${dataValues.length}
  `
  const result = await pool.query(dataQuery, dataValues)
  const items = result.rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
    currency: row.currency,
    status: row.status,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  }))
  return { items, totalCount }
}

async function getPaymentDetails(paymentId: string): Promise<Payment | null> {
  const query = `
    SELECT
      id,
      user_id AS "userId",
      amount,
      currency,
      status,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM payments
    WHERE id = $1
    LIMIT 1
  `
  const result = await pool.query(query, [paymentId])
  const row = result.rows[0]
  if (!row) return null
  return {
    id: row.id,
    userId: row.userId,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
    currency: row.currency,
    status: row.status,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  }
}