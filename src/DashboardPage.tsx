import { useState, useEffect, FormEvent } from 'react'
import { authFetch } from '../authFetch'
import { authHeaders } from '../authHeaders'
import { Link, useNavigate } from 'react-router-dom'
import LoadingSkeleton from '../loadingskeleton'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'
import Sparkline from './Sparkline'

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

interface BoardItem {
  id: string
  title?: string
  createdAt?: string
  created_at?: string
}

interface NodeItem {
  id: string
  createdAt?: string
  created_at?: string
}

export default function DashboardPage(): JSX.Element {
  const [maps, setMaps] = useState<MapItem[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [nodes, setNodes] = useState<NodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [createType, setCreateType] = useState<'map' | 'todo' | 'board'>('map')
  const [form, setForm] = useState({ title: '', description: '' })
  const navigate = useNavigate()

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      const [mapsRes, todosRes, boardsRes, nodesRes] = await Promise.all([
        authFetch('/.netlify/functions/mindmaps', { credentials: 'include' }),
        authFetch('/.netlify/functions/todos', { credentials: 'include' }),
        authFetch('/.netlify/functions/boards', { credentials: 'include' }),
        authFetch('/.netlify/functions/node', { credentials: 'include' }),
      ])
      const mapsData = mapsRes.ok && mapsRes.headers.get('content-type')?.includes('application/json')
        ? await mapsRes.json()
        : []
      const todoJson = todosRes.ok && todosRes.headers.get('content-type')?.includes('application/json')
        ? await todosRes.json()
        : []
      const todoList: TodoItem[] = Array.isArray(todoJson) ? todoJson : []
      const boardsJson = boardsRes.ok && boardsRes.headers.get('content-type')?.includes('application/json')
        ? await boardsRes.json()
        : { boards: [] }
      const boardsList: BoardItem[] = Array.isArray(boardsJson) ? boardsJson : boardsJson.boards || []
      const nodesJson = nodesRes.ok && nodesRes.headers.get('content-type')?.includes('application/json')
        ? await nodesRes.json()
        : { nodes: [] }
      const nodesList: NodeItem[] = Array.isArray(nodesJson) ? nodesJson : nodesJson.nodes || []
      setMaps(Array.isArray(mapsData) ? mapsData : [])
      setTodos(todoList)
      setBoards(boardsList)
      setNodes(nodesList)
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
        const res = await fetch('/.netlify/functions/mindmaps', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: { title: form.title, description: form.description } }),
        })
        const json = await res.json()
        if (json?.id) {
          navigate(`/maps/${json.id}`)
        }
      } else if (createType === 'todo') {
        await fetch('/.netlify/functions/todos', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: form.title, description: form.description }),
        })
      } else {
        await fetch('/.netlify/functions/boards', {
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
        const res = await fetch('/.netlify/functions/ai-create-mindmap', {
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
        const json = await res.json()
        if (json?.id) {
          navigate(`/maps/${json.id}`)
        }
      } else if (createType === 'todo') {
        await fetch('/.netlify/functions/ai-create-todo', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: form.description }),
        })
      } else {
        await fetch('/.netlify/functions/boards', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: form.title }),
        })
      }
      setShowModal(false)
      setForm({ title: '', description: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'AI creation failed')
    }
  }

  const handleTileClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const el = e.currentTarget
    el.classList.remove('clicked')
    void el.offsetWidth
    el.classList.add('clicked')
  }

  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay
  const dayAgo = now - oneDay
  const weekAgo = now - oneWeek
  const twoWeekAgo = now - 2 * oneWeek

  const mapDay = maps.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > dayAgo).length
  const mapWeek = maps.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > weekAgo).length

  const nodesThisWeek = nodes.filter(n => new Date(n.createdAt || n.created_at || '').getTime() > weekAgo).length
  const nodesLastWeek = nodes.filter(n => {
    const t = new Date(n.createdAt || n.created_at || '').getTime()
    return t > twoWeekAgo && t <= weekAgo
  }).length

  const todoAddedDay = todos.filter(t => new Date(t.createdAt || t.created_at || '').getTime() > dayAgo).length
  const todoAddedWeek = todos.filter(t => new Date(t.createdAt || t.created_at || '').getTime() > weekAgo).length
  const todoDoneDay = todos.filter(t => t.completed && new Date(t.updatedAt || t.updated_at || '').getTime() > dayAgo).length
  const todoDoneWeek = todos.filter(t => t.completed && new Date(t.updatedAt || t.updated_at || '').getTime() > weekAgo).length

  const boardDay = boards.filter(b => new Date(b.createdAt || b.created_at || '').getTime() > dayAgo).length
  const boardWeek = boards.filter(b => new Date(b.createdAt || b.created_at || '').getTime() > weekAgo).length

  const mapTrend = Array.from({ length: 14 }, (_v, i) => {
    const start = new Date(now - (13 - i) * oneDay)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + oneDay
    return maps.filter(m => {
      const t = new Date(m.createdAt || m.created_at || '').getTime()
      return t >= start.getTime() && t < end
    }).length
  })

  const todoTrend = Array.from({ length: 14 }, (_v, i) => {
    const start = new Date(now - (13 - i) * oneDay)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + oneDay
    return todos.filter(t => {
      const t1 = new Date(t.updatedAt || t.updated_at || '').getTime()
      return t.completed && t1 >= start.getTime() && t1 < end
    }).length
  })

  const boardTrend = Array.from({ length: 14 }, (_v, i) => {
    const start = new Date(now - (13 - i) * oneDay)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + oneDay
    return boards.filter(b => {
      const t2 = new Date(b.createdAt || b.created_at || '').getTime()
      return t2 >= start.getTime() && t2 < end
    }).length
  })

  const nodeTrend = Array.from({ length: 14 }, (_v, i) => {
    const start = new Date(now - (13 - i) * oneDay)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + oneDay
    return nodes.filter(n => {
      const tn = new Date(n.createdAt || n.created_at || '').getTime()
      return tn >= start.getTime() && tn < end
    }).length
  })

  const dateSort = (a: { createdAt?: string; created_at?: string; updatedAt?: string; updated_at?: string }, b: { createdAt?: string; created_at?: string; updatedAt?: string; updated_at?: string }): number => {
    const aTime = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || '').getTime()
    const bTime = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || '').getTime()
    return bTime - aTime
  }

  const recentMaps = [...maps].sort(dateSort).slice(0, 5)
  const recentTodos = [...todos].sort(dateSort).slice(0, 10)
  const recentBoards = [...boards].sort(dateSort).slice(0, 10)

  return (
    <div className="dashboard-page relative overflow-hidden">
      <FaintMindmapBackground className="mindmap-bg-small" />
      <MindmapArm side="left" />
      <MindmapArm side="right" />
      <h1 className="dashboard-title"><img src="./assets/logo.png" alt="MindXdo logo" className="dashboard-logo" /> Dashboard</h1>
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3 className="metric-title">Mind Maps</h3>
              <div className="metric-value">{maps.length}</div>
              <p>Today: {mapDay} &middot; Week: {mapWeek}</p>
              <p>Nodes: {nodesThisWeek} vs {nodesLastWeek}</p>
              <Sparkline data={nodeTrend} />
            </div>
            <div className="metric-card">
              <h3 className="metric-title">Todos</h3>
              <div className="metric-value">{todos.length}</div>
              <p>Added Week: {todoAddedWeek}</p>
              <p>Completed Week: {todoDoneWeek}</p>
              <Sparkline data={todoTrend} />
            </div>
            <div className="metric-card">
              <h3 className="metric-title">Kanban Boards</h3>
              <div className="metric-value">{boards.length}</div>
              <p>Today: {boardDay} &middot; Week: {boardWeek}</p>
              <p>Cards Added: 0 Completed: 0</p>
              <Sparkline data={boardTrend} />
            </div>
          </div>
          <div className="tiles-grid">
            <div className="tile">
              <div className="tile-header tile-header-center">
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
                <Link to="/mindmaps" className="tile-link">Open Mindmaps</Link>
              </div>
              <ul className="recent-list">
                {recentMaps.map(m => (
                  <li key={m.id}>
                    <Link to={`/maps/${m.id}`}>{m.title || 'Untitled Map'}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="tile" onClick={handleTileClick}>
              <div className="tile-header tile-header-center">
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
                <Link to="/todos" className="tile-link">Open Todos</Link>
              </div>
              <ul className="recent-list">
                {recentTodos.map(t => (
                  <li key={t.id}>
                    <Link to="/todo-demo">{t.title || t.content}</Link>
                    {t.completed && ' ✓'}
                  </li>
                ))}
              </ul>
            </div>
            <div className="tile" onClick={handleTileClick}>
              <div className="tile-header tile-header-center">
                <h2>Kanban Boards</h2>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setCreateType('board')
                    setShowModal(true)
                  }}
                >
                  Create
                </button>
                <Link to="/kanban" className="tile-link">Open Kanban Boards</Link>
              </div>
              <ul className="recent-list">
                {recentBoards.map(b => (
                  <li key={b.id}>
                    <Link to={`/kanban/${b.id}`}>{b.title || 'Board'}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal fancy-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <span className="flare-line" aria-hidden="true"></span>
            <h2 className="fade-item">Create {createType === 'map' ? 'Mind Map' : createType === 'todo' ? 'Todo' : 'Board'}</h2>
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
                <button type="button" className="btn-cancel fade-item" style={{ animationDelay: '0.3s' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary fade-item" style={{ animationDelay: '0.3s' }}>Quick Create</button>
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
