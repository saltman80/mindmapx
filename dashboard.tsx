import { useState, useEffect, FormEvent } from 'react'
import { authFetch } from './authFetch'
import { authHeaders } from './authHeaders'
import { Link } from 'react-router-dom'
import LoadingSkeleton from './loadingskeleton'
import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'

interface MapItem {
  id: string
  title?: string
  createdAt?: string
  created_at?: string
  data?: { title?: string; [key: string]: any }
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
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      const [mapsRes, todosRes] = await Promise.all([
        authFetch('/.netlify/functions/mindmap', { credentials: 'include' }),
        authFetch('/.netlify/functions/todos', { credentials: 'include' }),
      ])
      const mapsData = mapsRes.ok && mapsRes.headers.get('content-type')?.includes('application/json')
        ? await mapsRes.json()
        : []
      const todoJson = todosRes.ok && todosRes.headers.get('content-type')?.includes('application/json')
        ? await todosRes.json()
        : []
      const todoList: TodoItem[] = Array.isArray(todoJson) ? todoJson : []
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
        await fetch('/.netlify/functions/mindmap', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: form.title, description: form.description }),
        })
      } else {
        await fetch('/.netlify/functions/todos', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
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

  const handleAiCreate = async (): Promise<void> => {
    try {
      if (createType === 'map') {
        await fetch('/.netlify/functions/ai-create-mindmap', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            prompt: form.description,
          }),
        })
      } else {
        await fetch('/.netlify/functions/ai-create-todo', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: form.description }),
        })
      }
      setShowModal(false)
      setForm({ title: '', description: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'AI creation failed')
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
      <MindmapArm side="left" />
      <MindmapArm side="right" />
      <FaintMindmapBackground className="mindmap-bg-small" />
      <h1 className="dashboard-title"><img src="./assets/logo.png" alt="MindXdo logo" className="dashboard-logo" /> Dashboard</h1>
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
                <button
                  className="btn-primary"
                  onClick={() => {
                    setCreateType('map')
                    setShowModal(true)
                  }}
                >
                  Create
                </button>
              </div>
              <ul>
                {maps.map(m => (
                  <li key={m.id}>
                    <Link to={`/maps/${m.id}`}>{m.title || (m as any).data?.title || 'Untitled Map'}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="tile">
              <div className="tile-header">
                <h2>Todos</h2>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setCreateType('todo')
                    setShowModal(true)
                  }}
                >
                  Create
                </button>
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
          <div className="modal fancy-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <span className="flare-line" aria-hidden="true"></span>
            <h2 className="fade-item">Create {createType === 'map' ? 'Mind Map' : 'Todo'}</h2>
            <form onSubmit={handleCreate}>
              <div className="form-field fade-item" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="title" className="form-label">Title</label>
                <input id="title" className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-field fade-item" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="desc" className="form-label">Description</label>
                <textarea id="desc" className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel fade-item" style={{ animationDelay: '0.3s' }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary fade-item" style={{ animationDelay: '0.3s' }}>
                  Quick Create
                </button>
                <button type="button" className="btn-ai fade-item" style={{ animationDelay: '0.3s' }} onClick={handleAiCreate}>
                  <span className="sparkle" aria-hidden="true">✨</span>
                  Create With AI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
