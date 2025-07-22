import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import LoadingSkeleton from '../loadingskeleton'

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

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/list', { credentials: 'include' })
      const json = res.ok ? await res.json() : { data: { todos: [] } }
      const list: TodoItem[] = Array.isArray(json) ? json : json.data?.todos || []
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
      await fetch('/.netlify/functions/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title, description: form.description }),
      })
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
    <div className="list-page">
      <h1>Todos</h1>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Total: {todos.length}</h3>
              <p>Added Today: {addedDay} Week: {addedWeek}</p>
            </div>
            <div>
              <button onClick={() => setShowModal(true)}>Create Todo</button>
            </div>
          </div>
          <ul className="tile-list">
            {sorted.map(t => (
              <li key={t.id}>
                <Link
                  to="/todo-demo"
                  onClick={() => localStorage.setItem(`todo_last_viewed_${t.id}`, Date.now().toString())}
                >
                  {t.title || t.content}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} aria-hidden="true">
          <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2>Create Todo</h2>
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
