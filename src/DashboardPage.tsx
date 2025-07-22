import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import LoadingSkeleton from '../loadingskeleton'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'

interface MapItem {
  id: string
  title?: string
  createdAt?: string
  created_at?: string
}

interface TodoItem {
  id: string
  title?: string
  content?: string
  completed?: boolean
  mindmap_id?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export default function DashboardPage(): JSX.Element {
  const [maps, setMaps] = useState<MapItem[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [createType, setCreateType] = useState<'map' | 'todo'>('map')
  const [form, setForm] = useState({ title: '', description: '' })

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const [mapsRes, todosRes] = await Promise.all([
        fetch('/.netlify/functions/index', { credentials: 'include' }),
        fetch('/.netlify/functions/list', { credentials: 'include' }),
      ])
      const mapsData = mapsRes.ok && mapsRes.headers.get('content-type')?.includes('application/json')
        ? await mapsRes.json()
        : []
      const todoJson = todosRes.ok && todosRes.headers.get('content-type')?.includes('application/json')
        ? await todosRes.json()
        : { data: { todos: [] } }
      const todoList: TodoItem[] = Array.isArray(todoJson) ? todoJson : todoJson.data?.todos || []
      setMaps(Array.isArray(mapsData) ? mapsData : [])
      setTodos(todoList)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      if (createType === 'map') {
        await fetch('/.netlify/functions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        await fetch('/.netlify/functions/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, description: form.description }),
        })
      }
      setShowModal(false)
      setForm({ title: '', description: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Creation failed')
    }
  }

  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay
  const dayAgo = now - oneDay
  const weekAgo = now - oneWeek

  const mapDay = maps.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > dayAgo).length
  const mapWeek = maps.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > weekAgo).length

  const todoAddedDay = todos.filter(t => new Date(t.createdAt || t.created_at || '').getTime() > dayAgo).length
  const todoAddedWeek = todos.filter(t => new Date(t.createdAt || t.created_at || '').getTime() > weekAgo).length
  const todoDoneDay = todos.filter(t => t.completed && new Date(t.updatedAt || t.updated_at || '').getTime() > dayAgo).length
  const todoDoneWeek = todos.filter(t => t.completed && new Date(t.updatedAt || t.updated_at || '').getTime() > weekAgo).length

  return (
    <div className="dashboard-page relative overflow-hidden">
      <FaintMindmapBackground className="mindmap-bg-small" />
      <MindmapArm side="left" />
      <MindmapArm side="right" />
      <h1 className="dashboard-title">Dashboard</h1>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Mind Maps</h3>
              <p>Total: {maps.length}</p>
              <p>Today: {mapDay}</p>
              <p>This Week: {mapWeek}</p>
            </div>
            <div className="metric-card">
              <h3>Todos</h3>
              <p>Total: {todos.length}</p>
              <p>Added Today: {todoAddedDay} Completed: {todoDoneDay}</p>
              <p>Added Week: {todoAddedWeek} Completed: {todoDoneWeek}</p>
            </div>
            <div className="metric-card">
              <h3>Kanban Boards</h3>
              <Link to="/kanban" className="text-blue-600 underline">View Boards</Link>
            </div>
          </div>
          <div className="tiles-grid">
            <div className="tile">
              <div className="tile-header">
                <h2>Mind Maps</h2>
                <button onClick={() => { setCreateType('map'); setShowModal(true) }}>Create</button>
              </div>
              <ul>
                {maps.map(m => (
                  <li key={m.id}>
                    <Link to={`/maps/${m.id}`}>{m.title || 'Untitled Map'}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="tile">
              <div className="tile-header">
                <h2>Todos</h2>
                <button onClick={() => { setCreateType('todo'); setShowModal(true) }}>Create</button>
              </div>
              <ul>
                {todos.map(t => (
                  <li key={t.id}>
                    {t.title || t.content}
                    {t.mindmap_id && <span className="text-sm text-gray-500"> (Map: {t.mindmap_id})</span>}
                    {t.completed && ' ✓'}
                  </li>
                ))}
              </ul>
            </div>
            <div className="tile">
              <h2>Kanban Boards</h2>
              <Link to="/kanban" className="text-blue-600 underline">Open Kanban</Link>
            </div>
          </div>
        </>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} aria-hidden="true">
          <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2>Create {createType === 'map' ? 'Mind Map' : 'Todo'}</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="desc">Description</label>
                <textarea id="desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
