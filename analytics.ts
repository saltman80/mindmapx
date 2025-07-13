export const handler: Handler = async (event: HandlerEvent) => {
  try {
    const params = (event.queryStringParameters || {}) as Partial<QueryParams>
    const { startDate, endDate, format } = params
    if (!startDate || !endDate) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'startDate and endDate are required' })
      }
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Dates must be in YYYY-MM-DD format' })
      }
    }
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    if (!isValid(start) || !isValid(end)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid date value' })
      }
    }
    if (start.getTime() > end.getTime()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'startDate must be before or equal to endDate' })
      }
    }
    const isoStart = start.toISOString()
    const isoEnd = end.toISOString()
    if (format === 'csv') {
      const csv = await exportAnalyticsCSV(isoStart, isoEnd)
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics_${startDate}_${endDate}.csv"`
        },
        body: csv
      }
    }
    const data = await getAnalytics(isoStart, isoEnd)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }
  } catch (error) {
    console.error('Analytics handler error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}

export async function getAnalytics(startDate: string, endDate: string): Promise<AnalyticsData> {
  const userRes = await client.query(
    'SELECT COUNT(*) AS count FROM users WHERE created_at BETWEEN $1 AND $2',
    [startDate, endDate]
  )
  const mapsRes = await client.query(
    'SELECT COUNT(*) AS count FROM mindmaps WHERE created_at BETWEEN $1 AND $2',
    [startDate, endDate]
  )
  const todosRes = await client.query(
    'SELECT COUNT(*) AS count FROM todos WHERE created_at BETWEEN $1 AND $2',
    [startDate, endDate]
  )
  const paymentsRes = await client.query(
    'SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE status = $3 AND created_at BETWEEN $1 AND $2',
    [startDate, endDate, 'completed']
  )
  const newUsers = parseInt((userRes.rows[0] as any).count, 10)
  const mapsCreated = parseInt((mapsRes.rows[0] as any).count, 10)
  const todosCreated = parseInt((todosRes.rows[0] as any).count, 10)
  const totalRevenue = parseFloat((paymentsRes.rows[0] as any).total_revenue)
  return { newUsers, mapsCreated, todosCreated, totalRevenue }
}

export async function exportAnalyticsCSV(startDate: string, endDate: string): Promise<string> {
  const data = await getAnalytics(startDate, endDate)
  const headers = ['metric', 'value']
  const rows = [
    ['newUsers', data.newUsers.toString()],
    ['mapsCreated', data.mapsCreated.toString()],
    ['todosCreated', data.todosCreated.toString()],
    ['totalRevenue', data.totalRevenue.toFixed(2)]
  ]
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}