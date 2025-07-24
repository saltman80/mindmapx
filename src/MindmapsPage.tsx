import { useState, useEffect, FormEvent } from 'react'
import { authFetch } from '../authFetch'
import { authHeaders } from '../authHeaders'
import { Link, useNavigate } from 'react-router-dom'
import LoadingSkeleton from '../loadingskeleton'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'

interface MapItem {
  id: string
  title?: string
  createdAt?: string
  created_at?: string
  data?: { title?: string; [key: string]: any }
}

export default function MindmapsPage(): JSX.Element {
  const [maps, setMaps] = useState<MapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const navigate = useNavigate()

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch('/.netlify/functions/mindmaps')
      const data = await res.json()
      setMaps(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load maps')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    authFetch('/.netlify/functions/mindmaps')
      .then(res => res.json())
      .then(setMaps)
      .catch(() => {})
  }, [])

  const handleCreate = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      const res = await fetch('/.netlify/functions/mindmaps', {
        method: 'POST',
        credentials: 'include', // Required for session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { title: form.title, description: form.description } }),
      })
      const json = await res.json()
      setShowModal(false)
      setForm({ title: '', description: '' })
      if (json?.id) {
        navigate(`/maps/${json.id}`)
      } else {
        fetchData()
      }
    } catch (err: any) {
      alert(err.message || 'Creation failed')
    }
  }

  const handleAiCreate = async (): Promise<void> => {
    try {
      const res = await fetch('/.netlify/functions/ai-create-mindmap', {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          prompt: form.description,
        }),
      })
      const json = await res.json()
      setShowModal(false)
      setForm({ title: '', description: '' })
      if (json?.id) {
        navigate(`/maps/${json.id}`)
      } else {
        fetchData()
      }
    } catch (err: any) {
      alert(err.message || 'AI creation failed')
    }
  }

  const today = new Date().toDateString()
  const dayCount = maps.filter(m => new Date(m.created_at || m.createdAt || '').toDateString() === today).length


  return (
    <div className="dashboard-page relative overflow-hidden list-page">
      <MindmapArm side="left" />
      <FaintMindmapBackground className="mindmap-bg-small" />
      <h1 className="dashboard-title">🧠 Mind Maps</h1>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="four-col-grid">
          <div className="tile create-tile">
            <h2>Create Mind Map</h2>
            <p className="create-help">Click Create to manually add or use AI to get started.</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Create
            </button>
          </div>
          <div className="tile">
            <h2 className="tile-header">Metrics</h2>
            <p>Total: {maps.length}</p>
            <p>Today: {dayCount}</p>
          </div>
          {maps.map(m => (
            <div className="tile" key={m.id}>
              <div className="tile-header">
                <h2>{m.title || m.data?.title || 'Untitled Map'}</h2>
                <Link to={`/maps/${m.id}`}>Open</Link>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal fancy-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <span className="flare-line" aria-hidden="true"></span>
            <h2 className="fade-item">Create Mind Map</h2>
            <form onSubmit={handleCreate}>
              <div className="form-field fade-item" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="title" className="form-label">Title</label>
                <input
                  id="title"
                  className="form-input"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-field fade-item" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="desc" className="form-label">Description</label>
                <textarea
                  id="desc"
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
