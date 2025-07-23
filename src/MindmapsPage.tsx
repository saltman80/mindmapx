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

const getLastViewed = (id: string): number => {
  const v = localStorage.getItem(`mindmap_last_viewed_${id}`)
  return v ? parseInt(v, 10) : 0
}

export default function MindmapsPage(): JSX.Element {
  const [maps, setMaps] = useState<MapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/index', { credentials: 'include' })
      const data = res.ok ? await res.json() : []
      setMaps(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to load maps')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    try {
      await fetch('/.netlify/functions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    <section className="section relative overflow-hidden list-page">
      <MindmapArm side="left" />
      <FaintMindmapBackground className="mindmap-bg-small" />
      <h1>Mind Maps</h1>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="four-col-grid">
          <div className="tile">
            <div className="tile-header">
              <h2>Create Mind Map</h2>
              <button onClick={() => setShowModal(true)}>Create</button>
            </div>
          </div>
          <div className="tile">
            <h2 className="tile-header">Metrics</h2>
            <p>Total: {maps.length}</p>
            <p>Today: {mapDay} Week: {mapWeek}</p>
          </div>
          {sorted.map(m => (
            <div className="tile" key={m.id}>
              <div className="tile-header">
                <h2>{m.title || 'Untitled Map'}</h2>
                <Link
                  to={`/maps/${m.id}`}
                  onClick={() =>
                    localStorage.setItem(
                      `mindmap_last_viewed_${m.id}`,
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
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} aria-hidden="true">
          <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <h2>Create Mind Map</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="desc">Description</label>
                <textarea
                  id="desc"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
