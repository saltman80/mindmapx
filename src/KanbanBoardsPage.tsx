import { useState, useEffect, FormEvent } from 'react'
import { authFetch } from '../authFetch'
import { authHeaders } from '../authHeaders'
import { Link } from 'react-router-dom'
import LoadingSkeleton from '../loadingskeleton'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'

interface BoardItem {
  id: string
  title?: string
  createdAt?: string
  created_at?: string
}

const getLastViewed = (id: string): number => {
  const v = localStorage.getItem(`board_last_viewed_${id}`)
  return v ? parseInt(v, 10) : 0
}

export default function KanbanBoardsPage(): JSX.Element {
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
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
      const res = await authFetch('/.netlify/functions/boards', { credentials: 'include' })
      const json = res.ok ? await res.json() : { boards: [] }
      const list: BoardItem[] = Array.isArray(json) ? json : json.boards || []
      setBoards(list)
    } catch (err: any) {
      setError(err.message || 'Failed to load boards')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await fetch('/.netlify/functions/boards', {
        method: 'POST',
        credentials: 'include', // Required for session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: form.title, description: form.description }),
      })
      setShowModal(false)
      setForm({ title: '', description: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Creation failed')
    }
  }

  const handleAiCreate = async (): Promise<void> => {
    try {
      await fetch('/.netlify/functions/ai-create-board', {
        method: 'POST',
        credentials: 'include', // Required for session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: form.title, description: form.description }),
      })
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

  const boardDay = boards.filter(b => new Date(b.createdAt || b.created_at || '').getTime() > dayAgo).length
  const boardWeek = boards.filter(b => new Date(b.createdAt || b.created_at || '').getTime() > weekAgo).length

  const sorted = [...boards].sort((a, b) => {
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
      <h1 className="dashboard-title"><img src="./assets/logo.png" alt="MindXdo logo" className="dashboard-logo" /> Kanban Boards</h1>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <> 
          <div className="four-col-grid">
            <div className="tile create-tile">
              <h2>Create Board</h2>
              <p className="create-help">Click Create to manually add or use AI to get started.</p>
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                Create
              </button>
            </div>
            <div className="tile">
              <h2 className="tile-header">Metrics</h2>
              <p>Total: {boards.length}</p>
              <p>Today: {boardDay} Week: {boardWeek}</p>
            </div>
            {sorted.map(b => (
              <div className="tile" key={b.id}>
                <div className="tile-header">
                  <h2>{b.title || 'Board'}</h2>
                  <Link
                    to={`/kanban/${b.id}`}
                    onClick={() =>
                      localStorage.setItem(
                        `board_last_viewed_${b.id}`,
                        Date.now().toString()
                      )
                    }
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal fancy-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <span className="flare-line" aria-hidden="true"></span>
            <h2 className="fade-item">Create Board</h2>
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
