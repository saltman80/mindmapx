const formatDateInput = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const escapeCsvField = (field: string): string => {
  let escaped = field.replace(/"/g, '""')
  if (/^[=+\-@]/.test(escaped)) {
    escaped = '\'' + escaped
  }
  return `"${escaped}"`
}

export default function AnalyticsPage(): JSX.Element {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date()
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const start = new Date(end)
    start.setDate(end.getDate() - 7)
    return { start, end }
  })
  const [data, setData] = useState<AnalyticsDataItem[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const name = e.target.name as keyof DateRange
    const newDate = e.target.valueAsDate
    if (!newDate) return
    setDateRange(prev => ({
      ...prev,
      [name]: new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()),
    }))
  }

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const fetchData = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        })
        const res = await fetch(`/.netlify/functions/analytics?${params.toString()}`, { signal })
        if (!res.ok) {
          const errText = await res.text()
          throw new Error(errText || res.statusText)
        }
        const json = await res.json()
        setData(json.data as AnalyticsDataItem[])
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setError(err.message || 'Failed to load analytics')
        setData([])
      } finally {
        if (!signal.aborted) {
          setLoading(false)
        }
      }
    }

    if (dateRange.start > dateRange.end) {
      setError('Start date must be before end date')
      setData([])
      setLoading(false)
    } else {
      fetchData()
    }

    return () => {
      controller.abort()
    }
  }, [dateRange.start, dateRange.end])

  const exportCsv = (): void => {
    if (!data.length) return
    const headers = ['Date', 'New Users', 'Active Users', 'Maps Created', 'Todos Completed', 'Revenue']
    const rows = data.map(item => [
      new Date(item.date).toLocaleDateString(),
      item.newUsers.toString(),
      item.activeUsers.toString(),
      item.mapsCreated.toString(),
      item.todosCompleted.toString(),
      item.revenue.toFixed(2),
    ])
    const csvLines = [
      headers.map(escapeCsvField).join(','),
      ...rows.map(row => row.map(escapeCsvField).join(',')),
    ]
    const csvContent = csvLines.join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `analytics_${formatDateInput(dateRange.start)}_${formatDateInput(dateRange.end)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>
      <div className="analytics-controls">
        <label>
          Start Date:
          <input
            type="date"
            name="start"
            value={formatDateInput(dateRange.start)}
            onChange={handleDateChange}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            name="end"
            value={formatDateInput(dateRange.end)}
            onChange={handleDateChange}
          />
        </label>
        <button onClick={exportCsv} disabled={loading || !data.length}>
          Export CSV
        </button>
      </div>
      {loading && <p>Loading analytics...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && data.length > 0 && (
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>New Users</th>
              <th>Active Users</th>
              <th>Maps Created</th>
              <th>Todos Completed</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.date}>
                <td>{new Date(item.date).toLocaleDateString()}</td>
                <td>{item.newUsers}</td>
                <td>{item.activeUsers}</td>
                <td>{item.mapsCreated}</td>
                <td>{item.todosCompleted}</td>
                <td>${item.revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && !error && !data.length && <p>No data available for the selected range.</p>}
    </div>
  )
}