import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'
import LoadingSkeleton from '../loadingskeleton'

interface TodoItem {
  id: string
  title: string
  completed: boolean
}

interface TodoList {
  id: string | null
  title: string
  todos: TodoItem[]
  createdAt?: string
  created_at?: string
}

export default function TodosPage(): JSX.Element {
  const [lists, setLists] = useState<TodoList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '' })
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const fetchLists = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/todo-lists', {
        credentials: 'include',
      })
      const data = await res.json()
      const arr: TodoList[] = Array.isArray(data) ? data : []
      arr.sort((a, b) => (a.id === null ? 1 : 0) - (b.id === null ? 1 : 0))
      setLists(arr)
    } catch (err: any) {
      setError(err.message || 'Failed to load lists')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  const handleCreateList = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) return
    const res = await fetch('/.netlify/functions/todo-lists', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: form.description }),
    })
    if (!res.ok) return
    const list = await res.json()
    setLists(prev => [list, ...prev])
    setForm({ title: '', description: '' })
    setShowModal(false)
  }

  const handleDeleteList = async (id: string): Promise<void> => {
    if (!confirm('Delete this list and all todos?')) return
    const res = await fetch(`/.netlify/functions/todo-lists?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      setLists(prev => prev.filter(l => l.id !== id))
    }
  }

  const handleDeleteTodo = async (todoId: string): Promise<void> => {
    if (!confirm('Delete this todo?')) return
    const res = await fetch(`/.netlify/functions/todoid/${todoId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      setLists(prev =>
        prev.flatMap(l => {
          if (!l.todos.some(t => t.id === todoId)) return [l]
          const remaining = l.todos.filter(t => t.id !== todoId)
          if (l.id === null && remaining.length === 0) return []
          return [{ ...l, todos: remaining }]
        })
      )
    }
  }

  const handleAiCreate = async (): Promise<void> => {
    const res = await fetch('/.netlify/functions/ai-create-todo', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: form.description || form.title }),
    })
    const json = await res.json()
    if (json?.id) {
      navigate(`/todos/${json.id}`)
      setShowModal(false)
    }
  }

  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay
  const dayAgo = now - oneDay
  const weekAgo = now - oneWeek

  const createdToday = lists.filter(
    l => l.id && new Date(l.createdAt || l.created_at || '').getTime() > dayAgo
  ).length
  const createdThisWeek = lists.filter(
    l => l.id && new Date(l.createdAt || l.created_at || '').getTime() > weekAgo
  ).length

  return (
    <div className="dashboard-page relative overflow-hidden list-page">
      <MindmapArm side="left" />
      <FaintMindmapBackground className="mindmap-bg-small" />
      <h1 className="dashboard-title">
        <img src="./assets/logo.png" alt="MindXdo logo" className="dashboard-logo" /> Todos
      </h1>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="four-col-grid">
          <div className="dashboard-tile create-tile">
            <header className="tile-header">
              <h2>Create Todo List</h2>
            </header>
            <section className="tile-body">
              <p className="create-help">Click Create to Start</p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                Create
              </button>
            </section>
          </div>
          <div className="metric-tile simple">
            <div className="metric-header stacked">
              <h3>Metrics</h3>
              <div className="metric-circle">{lists.length}</div>
              <p className="metric-total">total</p>
            </div>
            <div className="metric-detail-grid">
              <div className="metric-detail">
                <span className="label">Today</span>
                <span className="value">{createdToday}</span>
              </div>
              <div className="metric-detail">
                <span className="label">Week</span>
                <span className="value">{createdThisWeek}</span>
              </div>
            </div>
          </div>
          {lists.length === 0 ? (
            <div className="dashboard-tile empty">
              <p>No todo lists found.</p>
            </div>
          ) : (
            lists.map(list => (
              <div className="dashboard-tile open-tile" key={list.id || 'unassigned'}>
                <header className="tile-header">
                  <h2>{list.title}</h2>
                  <div className="tile-actions">
                    <button className="btn btn-primary" onClick={() => navigate(`/todos/${list.id}`)}>
                      Open
                    </button>
                    {list.id && (
                      <a
                        href="#"
                        className="tile-link delete-link"
                        onClick={e => {
                          e.preventDefault()
                          handleDeleteList(list.id!)
                        }}
                      >
                        Delete
                      </a>
                    )}
                  </div>
                </header>
                <section className="tile-body">
                  {list.id === null ? (
                    <ul className="todo-items">
                      {list.todos.map(t => (
                        <li key={t.id} className="todo-item">
                          {t.title}{' '}
                          <a
                            href="#"
                            className="tile-link delete-link"
                            onClick={e => {
                              e.preventDefault()
                              handleDeleteTodo(t.id)
                            }}
                          >
                            Delete
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{list.todos?.length ?? 0} todos</p>
                  )}
                </section>
              </div>
            ))
          )}
          {Array.from({ length: 10 }).map((_, i) => (
            <div className="dashboard-tile ghost-tile" key={`ghost-${i}`} />
          ))}
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal fancy-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <span className="flare-line" aria-hidden="true"></span>
            <h2 className="fade-item">Create Todo List</h2>

            <form onSubmit={handleCreateList}>
              <div className="form-field fade-item" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="list-title" className="form-label">Title</label>
                <input
                  id="list-title"
                  className="form-input"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-field fade-item" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="list-desc" className="form-label">Description</label>
                <textarea
                  id="list-desc"
                  className="form-input"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
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
