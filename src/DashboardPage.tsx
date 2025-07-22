import { useState, useEffect, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import LoadingSkeleton from '../loadingskeleton'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'
import Sparkline from './Sparkline'

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

interface BoardItem {
  id: string
  title?: string
  createdAt?: string
  created_at?: string
}

export default function DashboardPage(): JSX.Element {
  const [maps, setMaps] = useState<MapItem[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [createType, setCreateType] = useState<'map' | 'todo' | 'board'>('map')
  const [form, setForm] = useState({ title: '', description: '' })

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const [mapsRes, todosRes, boardsRes] = await Promise.all([
        fetch('/.netlify/functions/index', { credentials: 'include' }),
        fetch('/.netlify/functions/list', { credentials: 'include' }),
        fetch('/.netlify/functions/boards', { credentials: 'include' }),
      ])
      const mapsData = mapsRes.ok && mapsRes.headers.get('content-type')?.includes('application/json')
        ? await mapsRes.json()
        : []
      const todoJson = todosRes.ok && todosRes.headers.get('content-type')?.includes('application/json')
        ? await todosRes.json()
        : { data: { todos: [] } }
      const todoList: TodoItem[] = Array.isArray(todoJson) ? todoJson : todoJson.data?.todos || []
      const boardsJson = boardsRes.ok && boardsRes.headers.get('content-type')?.includes('application/json')
        ? await boardsRes.json()
        : { boards: [] }
      const boardsList: BoardItem[] = Array.isArray(boardsJson) ? boardsJson : boardsJson.boards || []
      setMaps(Array.isArray(mapsData) ? mapsData : [])
      setTodos(todoList)
      setBoards(boardsList)
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
      } else if (createType === 'todo') {
        await fetch('/.netlify/functions/todos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, description: form.description }),
        })
      } else {
        await fetch('/.netlify/functions/boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title }),
        })
      }
      setShowModal(false)
      setForm({ title: '', description: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Creation failed')
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

  const mapDay = maps.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > dayAgo).length
  const mapWeek = maps.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > weekAgo).length

  const todoAddedDay = todos.filter(t => new Date(t.createdAt || t.created_at || '').getTime() > dayAgo).length
  const todoAddedWeek = todos.filter(t => new Date(t.createdAt || t.created_at || '').getTime() > weekAgo).length
  const todoDoneDay = todos.filter(t => t.completed && new Date(t.updatedAt || t.updated_at || '').getTime() > dayAgo).length
  const todoDoneWeek = todos.filter(t => t.completed && new Date(t.updatedAt || t.updated_at || '').getTime() > weekAgo).length

  const boardDay = boards.filter(b => new Date(b.createdAt || b.created_at || '').getTime() > dayAgo).length
  const boardWeek = boards.filter(b => new Date(b.createdAt || b.created_at || '').getTime() > weekAgo).length

  const sevenDayTotals = Array.from({ length: 7 }, (_v, i) => {
    const start = new Date(now - (6 - i) * oneDay)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + oneDay
    const countMaps = maps.filter(m => {
      const t = new Date(m.createdAt || m.created_at || '').getTime()
      return t >= start.getTime() && t < end
    }).length
    const countTodos = todos.filter(t => {
      const t1 = new Date(t.createdAt || t.created_at || '').getTime()
      return t1 >= start.getTime() && t1 < end
    }).length
    const countBoards = boards.filter(b => {
      const t2 = new Date(b.createdAt || b.created_at || '').getTime()
      return t2 >= start.getTime() && t2 < end
    }).length
    return countMaps + countTodos + countBoards
  })

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
              <h3 className="metric-title">Mind Maps</h3>
              <div className="metric-value">{maps.length}</div>
              <p>Today: {mapDay} &middot; Week: {mapWeek}</p>
            </div>
            <div className="metric-card">
              <h3 className="metric-title">Todos</h3>
              <div className="metric-value">{todos.length}</div>
              <p>Added Today: {todoAddedDay}</p>
              <p>Completed Today: {todoDoneDay}</p>
            </div>
            <div className="metric-card">
              <h3 className="metric-title">Kanban Boards</h3>
              <div className="metric-value">{boards.length}</div>
              <p>Today: {boardDay} &middot; Week: {boardWeek}</p>
            </div>
            <div className="metric-card">
              <h3 className="metric-title">7 Day Activity</h3>
              <Sparkline data={sevenDayTotals} />
            </div>
          </div>
          <div className="tiles-grid">
            <div className="tile" onClick={handleTileClick}>
              <div className="tile-header">
                <h2>Mind Maps</h2>
                <button onClick={() => { setCreateType('map'); setShowModal(true) }}>Create</button>
              </div>
              <ul className="recent-list">
                {maps.slice(0, 10).map(m => (
                  <li key={m.id}>
                    <Link to={`/maps/${m.id}`}>{m.title || 'Untitled Map'}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="tile" onClick={handleTileClick}>
              <div className="tile-header">
                <h2>Todos</h2>
                <button onClick={() => { setCreateType('todo'); setShowModal(true) }}>Create</button>
              </div>
              <ul className="recent-list">
                {todos.slice(0, 10).map(t => (
                  <li key={t.id}>
                    <Link to="/todo-demo">{t.title || t.content}</Link>
                    {t.completed && ' ✓'}
                  </li>
                ))}
              </ul>
            </div>
            <div className="tile" onClick={handleTileClick}>
              <div className="tile-header">
                <h2>Kanban Boards</h2>
                <button onClick={() => { setCreateType('board'); setShowModal(true) }}>Create</button>
              </div>
              <ul className="recent-list">
                {boards.slice(0, 10).map(b => (
                  <li key={b.id}>
                    <Link to="/kanban">{b.title || 'Board'}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} aria-hidden="true">
          <div className="modal fancy-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <span className="flare-line" aria-hidden="true"></span>
            <h2 className="fade-item">Create {createType === 'map' ? 'Mind Map' : createType === 'todo' ? 'Todo' : 'Board'}</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="title" className="fade-item" style={{ animationDelay: '0.1s' }}>Title</label>
                <input id="title" className="fade-item" style={{ animationDelay: '0.1s' }} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label htmlFor="desc" className="fade-item" style={{ animationDelay: '0.2s' }}>Description</label>
                <textarea id="desc" className="fade-item" style={{ animationDelay: '0.2s' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="button" className="fade-item" style={{ animationDelay: '0.3s' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="fade-item" style={{ animationDelay: '0.3s' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
