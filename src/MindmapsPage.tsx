import { useState, useEffect, FormEvent } from 'react'
import { authFetch } from '../authFetch'
import { authHeaders } from '../authHeaders'
import { useNavigate } from 'react-router-dom'
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
  const [aiLoading, setAiLoading] = useState(false)
  const [nodeCounts, setNodeCounts] = useState<Record<string, number>>({})
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
    fetchData()
  }, [])

  useEffect(() => {
    maps.forEach(m => {
      if (nodeCounts[m.id] !== undefined) return
      authFetch(`/.netlify/functions/nodes?mindmapId=${m.id}`)
        .then(res => res.json())
        .then(data => {
          const nodes = Array.isArray(data?.nodes)
            ? data.nodes
            : Array.isArray(data)
              ? data
              : []
          setNodeCounts(prev => ({ ...prev, [m.id]: nodes.length }))
        })
        .catch(() => {
          setNodeCounts(prev => ({ ...prev, [m.id]: 0 }))
        })
    })
  }, [maps])

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
        setTimeout(() => navigate(`/maps/${json.id}`), 250)
      } else {
        fetchData()
      }
    } catch (err: any) {
      alert(err.message || 'Creation failed')
    }
  }

  const handleAiCreate = async (): Promise<void> => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai-create-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: undefined,
          title: form.title,
          description: form.description
        })
      })
      const json = await res.json()
      setShowModal(false)
      setForm({ title: '', description: '' })
      if (json?.mindmapId) {
        setTimeout(() => navigate(`/maps/${json.mindmapId}`), 250)
      } else {
        fetchData()
      }
    } catch (err: any) {
      alert(err.message || 'AI creation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Delete this mind map?')) return
    try {
      const res = await fetch(`/.netlify/functions/mindmaps?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete')
      setMaps(prev => prev.filter(m => m.id !== id))
    } catch (err: any) {
      alert(err.message || 'Delete failed')
    }
  }

  const getLastViewed = (id: string): number => {
    const v = localStorage.getItem(`mindmap_last_viewed_${id}`)
    return v ? parseInt(v, 10) : 0
  }

  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay
  const dayAgo = now - oneDay
  const weekAgo = now - oneWeek

  const mapDay = maps.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > dayAgo).length
  const mapWeek = maps.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > weekAgo).length

  const sorted = [...maps].sort((a, b) => {
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
      <h1 className="dashboard-title"><img src="./assets/logo.png" alt="MindXdo logo" className="dashboard-logo" /> Mind Maps</h1>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="four-col-grid">
          <div className="dashboard-tile create-tile">
            <header className="tile-header">
              <h2>Create Mind Map</h2>
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
              <div className="metric-circle">{maps.length}</div>
              <p className="metric-total">total</p>
            </div>
            <div className="metric-detail-grid">
              <div className="metric-detail">
                <span className="label">Today</span>
                <span className="value">{mapDay}</span>
              </div>
              <div className="metric-detail">
                <span className="label">Week</span>
                <span className="value">{mapWeek}</span>
              </div>
            </div>
          </div>

          {sorted.length === 0 ? (
            <div className="dashboard-tile empty">
              <p>No mind maps found.</p>
            </div>
          ) : (
            sorted.map(m => (
              <div className="dashboard-tile open-tile" key={m.id}>
                <header className="tile-header">
                  <h2>{m.title || m.data?.title || 'Untitled Map'}</h2>
                  <div className="tile-actions">
                    <a
                      href="#"
                      className="tile-link delete-link"
                      onClick={e => {
                        e.preventDefault()
                        handleDelete(m.id)
                      }}
                    >
                      Delete
                    </a>
                  </div>
                </header>
                <section className="tile-body">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      localStorage.setItem(
                        `mindmap_last_viewed_${m.id}`,
                        Date.now().toString()
                      )
                      navigate(`/maps/${m.id}`)
                    }}
                  >
                    Open
                  </button>
                  <div className="tile-stats">
                    <div className="metric-detail">
                      <span className="label">Nodes</span>
                      <span className="value">{nodeCounts[m.id] ?? '-'}</span>
                    </div>
                  </div>
                </section>
              </div>
            ))
          )}
          {Array.from({ length: 10 }).map((_v, i) => (
            <div className="dashboard-tile ghost-tile" key={`ghost-${i}`}></div>
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
                  {aiLoading ? 'Generating...' : <><span className="sparkle" aria-hidden="true">✨</span> Create With AI</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
