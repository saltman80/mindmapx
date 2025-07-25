import { useState, useEffect, FormEvent } from 'react'
import { authFetch } from '../authFetch'
import { authHeaders } from '../authHeaders'
import { useNavigate } from 'react-router-dom'
import LoadingSkeleton from '../loadingskeleton'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'

interface TodoItem {
  id: string
  title?: string
  content?: string
  completed?: boolean
  createdAt?: string
  created_at?: string
}

const getLastViewed = (id: string): number => {
  const v = localStorage.getItem(`todo_last_viewed_${id}`)
  return v ? parseInt(v, 10) : 0
}

export default function TodosPage(): JSX.Element {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const navigate = useNavigate()

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/.netlify/functions/todos', { credentials: 'include' })
      const json = res.ok ? await res.json() : []
      const list: TodoItem[] = Array.isArray(json) ? json : []
      setTodos(list)
    } catch (err: any) {
      setError(err.message || 'Failed to load todos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      const res = await fetch('/.netlify/functions/todos', {
        method: 'POST',
        credentials: 'include', // Required for session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: form.title, description: form.description }),
      })
      const json = await res.json()
      setShowModal(false)
      setForm({ title: '', description: '' })
      if (json?.id) {
        setTimeout(() => navigate(`/todos/${json.id}`), 250)
      } else {
        fetchData()
      }
    } catch (err: any) {
      alert(err.message || 'Creation failed')
    }
  }

  const handleAiCreate = async (): Promise<void> => {
    try {
      const res = await fetch('/.netlify/functions/ai-create-todo', {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({ prompt: form.description }),
      })
      const json = await res.json()
      setShowModal(false)
      setForm({ title: '', description: '' })
      if (json?.id) {
        setTimeout(() => navigate(`/todos/${json.id}`), 250)
      } else {
        fetchData()
      }
    } catch (err: any) {
      alert(err.message || 'AI creation failed')
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Delete this todo?')) return
    try {
      const res = await fetch(`/.netlify/functions/todos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete')
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      alert(err.message || 'Delete failed')
    }
  }

  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay
  const dayAgo = now - oneDay
  const weekAgo = now - oneWeek

  const addedDay = todos.filter(t => new Date(t.createdAt || t.created_at || '').getTime() > dayAgo).length
  const addedWeek = todos.filter(t => new Date(t.createdAt || t.created_at || '').getTime() > weekAgo).length

  const sorted = [...todos].sort((a, b) => {
    const av = getLastViewed(a.id)
    const bv = getLastViewed(b.id)
    if (av !== bv) return bv - av
    const at = new Date(a.createdAt || a.created_at || '').getTime()
    const bt = new Date(b.createdAt || b.created_at || '').getTime()
    return bt - at
  })

  return (
    <div className="dashboard-page relative overflow-hidden list-page">
      <MindmapArm side="left" />
      <FaintMindmapBackground className="mindmap-bg-small" />
      <h1 className="dashboard-title"><img src="./assets/logo.png" alt="MindXdo logo" className="dashboard-logo" /> Todos</h1>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <> 
          <div className="four-col-grid">
            <div className="dashboard-tile create-tile">
              <header className="tile-header"><h2>Create Todo</h2></header>
              <section className="tile-body">
                <p className="create-help">Click Create to Start</p>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                  Create
                </button>
              </section>
            </div>
            <div className="metric-tile">
              <header className="tile-header"><h2>Metrics</h2></header>
              <section className="tile-body">
                <p>Total: {todos.length}</p>
                <div className="metric-detail-grid">
                  <div className="metric-detail">
                    <span className="label">Today</span>
                    <span className="value">{addedDay}</span>
                  </div>
                  <div className="metric-detail">
                    <span className="label">Week</span>
                    <span className="value">{addedWeek}</span>
                  </div>
                </div>
              </section>
            </div>
            {sorted.map(t => (
              <div className="dashboard-tile open-tile" key={t.id}>
                <header className="tile-header">
                  <h2>{t.title || t.content}</h2>
                  <div className="tile-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        localStorage.setItem(
                          `todo_last_viewed_${t.id}`,
                          Date.now().toString()
                        )
                        navigate(`/todos/${t.id}`)
                      }}
                    >
                      Open
                    </button>
                    <a
                      href="#"
                      className="tile-link delete-link"
                      onClick={e => {
                        e.preventDefault()
                        handleDelete(t.id)
                      }}
                    >
                      Delete
                    </a>
                  </div>
                </header>
                <section className="tile-body">
                  <p>{t.content || 'Todo details coming soon...'}</p>
                </section>
              </div>
            ))}
            {Array.from({ length: 10 }).map((_v, i) => (
              <div className="dashboard-tile ghost-tile" key={`ghost-${i}`}></div>
            ))}
          </div>
        </>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal fancy-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <span className="flare-line" aria-hidden="true"></span>
            <h2 className="fade-item">Create Todo</h2>
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
