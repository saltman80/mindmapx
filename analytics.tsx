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

export default function AnalyticsPage(): JSX.Element {
  const { user } = useUser()
  if (!isAdmin(user)) {
    return <p>Forbidden</p>
  }
  const [data, setData] = useState<AnalyticsPoint[]>([])
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

  return (
    <div className="analytics-page">
      <AdminNav />
      <h1>Analytics</h1>
      {loading && <p>Loading analytics...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <div className="analytics-grid">
          <div>
            <h2>Kanban Boards</h2>
            <Sparkline data={series.kanbans} />
          </div>
          <div>
            <h2>Todo Lists</h2>
            <Sparkline data={series.todoLists} />
          </div>
          <div>
            <h2>Todos</h2>
            <Sparkline data={series.todos} />
          </div>
          <div>
            <h2>Mindmaps</h2>
            <Sparkline data={series.mindmaps} />
          </div>
          <div>
            <h2>Nodes</h2>
            <Sparkline data={series.nodes} />
          </div>
          <div>
            <h2>AI Processes</h2>
            <Sparkline data={series.aiProcesses} />
          </div>
        </div>
      )}
    </div>
  )
}
