import { useState, useEffect } from 'react'
import AdminNav from './src/AdminNav'
import Sparkline from './src/Sparkline'
import { useUser } from './src/lib/UserContext'
import { isAdmin } from './src/lib/isAdmin'

interface AnalyticsPoint {
  day: string
  kanbans: number
  todoLists: number
  todos: number
  mindmaps: number
  nodes: number
  aiProcesses: number
}

interface AnalyticsTotals {
  kanbans: number
  todoLists: number
  todos: number
  mindmaps: number
  nodes: number
  aiProcesses: number
}

export default function AnalyticsPage(): JSX.Element {
  const { user } = useUser()
  if (!isAdmin(user)) {
    return <p>Forbidden</p>
  }
  const [data, setData] = useState<AnalyticsPoint[]>([])
  const [totals, setTotals] = useState<AnalyticsTotals>({
    kanbans: 0,
    todoLists: 0,
    todos: 0,
    mindmaps: 0,
    nodes: 0,
    aiProcesses: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetch('/api/analytics?days=30', {
      signal: controller.signal,
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then(json => {
        setData(json.data as AnalyticsPoint[])
        setTotals(json.totals as AnalyticsTotals)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unknown error')
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const series = {
    kanbans: data.map(d => d.kanbans),
    todoLists: data.map(d => d.todoLists),
    todos: data.map(d => d.todos),
    mindmaps: data.map(d => d.mindmaps),
    nodes: data.map(d => d.nodes),
    aiProcesses: data.map(d => d.aiProcesses),
  }

  const metrics: { key: keyof typeof series; label: string }[] = [
    { key: 'kanbans', label: 'Kanban Boards' },
    { key: 'todoLists', label: 'Todo Lists' },
    { key: 'todos', label: 'Todos' },
    { key: 'mindmaps', label: 'Mindmaps' },
    { key: 'nodes', label: 'Nodes' },
    { key: 'aiProcesses', label: 'AI Processes' },
  ]

  return (
    <div className="analytics-page">
      <AdminNav />
      <h1>Analytics</h1>
      {loading && <p>Loading analytics...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <div className="analytics-grid">
          {metrics.map(m => (
            <div key={m.key} className="analytic-tile">
              <h2>{m.label}</h2>
              <p className="tile-value">{totals[m.key]}</p>
              <Sparkline data={series[m.key]} height={60} showArea />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
