import { useState, useEffect, FormEvent } from 'react'
import { authFetch } from '../authFetch'
import { authHeaders } from '../authHeaders'
import { Link, useNavigate } from 'react-router-dom'
import LoadingSkeleton from '../loadingskeleton'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'
import Sparkline from './Sparkline'
import DashboardTile, { DashboardItem } from './DashboardTile'
import { LIMIT_MINDMAPS, LIMIT_TODO_LISTS, LIMIT_KANBAN_BOARDS, LIMIT_AI_MONTHLY, LIMIT_MINDMAPS_TRIAL, LIMIT_TODO_LISTS_TRIAL, LIMIT_KANBAN_BOARDS_TRIAL } from "./constants"
import {
  MapItem,
  BoardItem,
  NodeItem,
  validateMaps,
  validateBoards,
  validateNodes,
} from './apiValidators'

interface TodoItem {
  id: string
  title?: string
  completed?: boolean
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

interface TodoList {
  id: string | null
  title: string
  todos: TodoItem[]
  createdAt?: string
  created_at?: string
}

export default function DashboardPage(): JSX.Element {
  const [maps, setMaps] = useState<MapItem[]>([])
  const [todoLists, setTodoLists] = useState<TodoList[]>([])
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [nodes, setNodes] = useState<NodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [createType, setCreateType] = useState<'map' | 'todo' | 'board'>('map')
  const [form, setForm] = useState({ title: '', description: '' })
  const [aiLoading, setAiLoading] = useState(false)
  const [aiUsage, setAiUsage] = useState(0)
  const [aiLimit, setAiLimit] = useState(LIMIT_AI_MONTHLY)
  const [cardsDoneToday, setCardsDoneToday] = useState(0)
  const [cardsDoneWeek, setCardsDoneWeek] = useState(0)
  const [isTrial, setIsTrial] = useState(false)
  const navigate = useNavigate()

  const mindmapLimit = isTrial ? LIMIT_MINDMAPS_TRIAL : LIMIT_MINDMAPS
  const todoLimit = isTrial ? LIMIT_TODO_LISTS_TRIAL : LIMIT_TODO_LISTS
  const boardLimit = isTrial ? LIMIT_KANBAN_BOARDS_TRIAL : LIMIT_KANBAN_BOARDS

  const fetchData = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const [mapsRes, listsRes, boardsRes, nodesRes, cardMetricsRes, statusRes, usageRes] = await Promise.all([
        authFetch('/.netlify/functions/mindmaps', { credentials: 'include' }),
        authFetch('/.netlify/functions/todo-lists', { credentials: 'include' }),
        authFetch('/.netlify/functions/boards', { credentials: 'include' }),
        authFetch('/.netlify/functions/node', { credentials: 'include' }),
        authFetch('/.netlify/functions/kanban-card-metrics', { credentials: 'include' }),
        authFetch('/.netlify/functions/user-status', { credentials: 'include' }),
        authFetch('/.netlify/functions/usage', { credentials: 'include' }),
      ])
      const mapsJson = mapsRes.ok && mapsRes.headers.get('content-type')?.includes('application/json')
        ? await mapsRes.json()
        : []
      const mapsList = validateMaps(Array.isArray(mapsJson) ? mapsJson : mapsJson.maps)

      const listsJson = listsRes.ok && listsRes.headers.get('content-type')?.includes('application/json')
        ? await listsRes.json()
        : []
      const lists: TodoList[] = Array.isArray(listsJson) ? listsJson : []

      const boardsJson = boardsRes.ok && boardsRes.headers.get('content-type')?.includes('application/json')
        ? await boardsRes.json()
        : []
      const boardsList = validateBoards(Array.isArray(boardsJson) ? boardsJson : boardsJson.boards)

      const nodesJson = nodesRes.ok && nodesRes.headers.get('content-type')?.includes('application/json')
        ? await nodesRes.json()
        : []
      const metricsJson = cardMetricsRes.ok && cardMetricsRes.headers.get('content-type')?.includes('application/json')
        ? await cardMetricsRes.json()
        : { doneToday: 0, doneWeek: 0 }
      const statusJson = statusRes.ok && statusRes.headers.get('content-type')?.includes('application/json')
        ? await statusRes.json()
        : null
      const usageJson = usageRes.ok && usageRes.headers.get('content-type')?.includes('application/json')
        ? await usageRes.json()
        : { aiUsage: 0, aiLimit: LIMIT_AI_MONTHLY }
      const doneToday = Number(metricsJson.doneToday) || 0
      const doneWeek = Number(metricsJson.doneWeek) || 0
      const nodesList = validateNodes(Array.isArray(nodesJson) ? nodesJson : nodesJson.nodes)

      setAiUsage(Number(usageJson.aiUsage) || 0)
      setAiLimit(Number(usageJson.aiLimit) || LIMIT_AI_MONTHLY)
      setIsTrial(statusJson?.data?.subscription_status === 'trialing')

      setMaps(Array.isArray(mapsList) ? mapsList : [])
      setTodoLists(Array.isArray(lists) ? lists : [])
      setBoards(Array.isArray(boardsList) ? boardsList : [])
      setNodes(Array.isArray(nodesList) ? nodesList : [])
      setCardsDoneToday(doneToday)
      setCardsDoneWeek(doneWeek)
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
          setTimeout(() => navigate(`/maps/${json.id}`), 250)
        }
      } else if (createType === 'todo') {
        const res = await fetch('/.netlify/functions/todo-lists', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: form.title }),
        })
        const data = await res.json()
        if (data?.id) {
          setTimeout(() => navigate(`/todos/${data.id}`), 250)
        }
      } else {
        const res = await fetch('/.netlify/functions/boards', {
          method: 'POST',
          credentials: 'include', // Required for session cookie
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: form.title, description: form.description }),
        })
        const data = await res.json()
        if (data?.id) {
          setTimeout(() => navigate(`/kanban/${data.id}`), 250)
        }
      }
      setShowModal(false)
      setForm({ title: '', description: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'Creation failed')
    }
  }

  const handleAiCreate = async (): Promise<void> => {
    if (aiUsage >= aiLimit) {
      alert('AI automation limit reached')
      return
    }
    setAiLoading(true)
    try {
      if (createType === 'map') {
        const res = await fetch('/api/ai-create-mindmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, description: form.description })
        })
        const json = await res.json()
        if (json?.mindmapId) {
          setTimeout(() => navigate(`/maps/${json.mindmapId}`), 250)
        }
      } else if (createType === 'todo') {
        const res = await fetch('/api/todo-lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title })
        })
        const data = await res.json()
        if (data?.id) {
          setTimeout(() => navigate(`/todos/${data.id}`), 250)
        }
      } else {
        const res = await fetch('/api/boards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title })
        })
        const data = await res.json()
        if (data?.id) {
          setTimeout(() => navigate(`/kanban/${data.id}`), 250)
        }
      }
      setShowModal(false)
      setForm({ title: '', description: '' })
      fetchData()
    } catch (err: any) {
      alert(err.message || 'AI creation failed')
    } finally {
      setAiLoading(false)
    }
  }


  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay
  const dayAgo = now - oneDay
  const weekAgo = now - oneWeek
  const twoWeekAgo = now - 2 * oneWeek

  const safeMapArray = Array.isArray(maps) ? maps : []
  const safeTodoLists = Array.isArray(todoLists) ? todoLists : []
  const safeBoardArray = Array.isArray(boards) ? boards : []
  const safeNodeArray = Array.isArray(nodes) ? nodes : []

  const mapDay = safeMapArray.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > dayAgo).length
  const mapWeek = safeMapArray.filter(m => new Date(m.createdAt || m.created_at || '').getTime() > weekAgo).length

  const nodesThisWeek = safeNodeArray.filter(n => new Date(n.createdAt || n.created_at || '').getTime() > weekAgo).length
  const nodesLastWeek = safeNodeArray.filter(n => {
    const t = new Date(n.createdAt || n.created_at || '').getTime()
    return t > twoWeekAgo && t <= weekAgo
  }).length

  const totalTodos = safeTodoLists.reduce((sum, l) => sum + l.todos.length, 0)

  const todoDoneDay = safeTodoLists.reduce(
    (sum, l) =>
      sum + l.todos.filter(t => t.completed && new Date(t.updatedAt || t.updated_at || '').getTime() > dayAgo).length,
    0
  )
  const todoDoneWeek = safeTodoLists.reduce(
    (sum, l) =>
      sum + l.todos.filter(t => t.completed && new Date(t.updatedAt || t.updated_at || '').getTime() > weekAgo).length,
    0
  )

  const mapTrend = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * oneDay)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + oneDay
    return safeMapArray.filter(m => {
      const t = new Date(m.createdAt || m.created_at || '').getTime()
      return t >= start.getTime() && t < end
    }).length
  })

  const todoTrend = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * oneDay)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + oneDay
    return safeTodoLists.reduce(
      (sum, l) =>
        sum +
        l.todos.filter(t => {
          const t1 = new Date(t.updatedAt || t.updated_at || '').getTime()
          return t.completed && t1 >= start.getTime() && t1 < end
        }).length,
      0
    )
  })

  const boardTrend = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * oneDay)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + oneDay
    return safeBoardArray.filter(b => {
      const t2 = new Date(b.createdAt || b.created_at || '').getTime()
      return t2 >= start.getTime() && t2 < end
    }).length
  })

  const nodeTrend = Array.from({ length: 14 }, (_, i) => {
    const start = new Date(now - (13 - i) * oneDay)
    start.setHours(0, 0, 0, 0)
    const end = start.getTime() + oneDay
    return safeNodeArray.filter(n => {
      const tn = new Date(n.createdAt || n.created_at || '').getTime()
      return tn >= start.getTime() && tn < end
    }).length
  })

  const dateSort = (a: { createdAt?: string; created_at?: string; updatedAt?: string; updated_at?: string }, b: { createdAt?: string; created_at?: string; updatedAt?: string; updated_at?: string }): number => {
    const aTime = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at || '').getTime()
    const bTime = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at || '').getTime()
    return bTime - aTime
  }

  const recentMaps = [...safeMapArray].sort(dateSort).slice(0, 3)
  const recentTodoLists = [...safeTodoLists].sort(dateSort).slice(0, 3)
  const recentBoards = [...safeBoardArray].sort(dateSort).slice(0, 3)

  const mapItems: DashboardItem[] = Array.isArray(recentMaps)
    ? recentMaps.map(m => ({
        id: m.id,
        label: m.title || 'Untitled Map',
        link: `/maps/${m.id}`,
      }))
    : []
  const todoItems: DashboardItem[] = Array.isArray(recentTodoLists)
    ? recentTodoLists
        .filter(l => l.id)
        .map(l => ({
          id: l.id as string,
          label: l.title,
          link: `/todos/${l.id}`,
          subText: `${l.todos.length} todo${l.todos.length !== 1 ? 's' : ''}`,
        }))
    : []
  const boardItems: DashboardItem[] = Array.isArray(recentBoards)
    ? recentBoards.map(b => ({
        id: b.id,
        label: b.title || 'Board',
        link: `/kanban/${b.id}`,
      }))
    : []

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
          <div className="dashboard-grid">
            <div className="dashboard-row">
              <div className="metric-tile">
                <div className="metric-left">
                  <div className="metric-header">
                    <div className="metric-circle">{maps.length}</div>
                    <h3>Mind Maps</h3>
                  </div>
                  <Sparkline data={mapTrend} />
                  <span className="trend-label">Week Trend</span>
                </div>
                <div className="metric-right metric-detail-grid">
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
              <div className="metric-tile">
                <div className="metric-left">
                  <div className="metric-header">
                    <div className="metric-circle">{totalTodos}</div>
                    <h3>Todos</h3>
                  </div>
                  <Sparkline data={todoTrend} />
                  <span className="trend-label">Week Trend</span>
                </div>
                <div className="metric-right metric-detail-grid">
                  <div className="metric-detail">
                    <span className="label">Done Today</span>
                    <span className="value">{todoDoneDay}</span>
                  </div>
                  <div className="metric-detail">
                    <span className="label">Done Week</span>
                    <span className="value">{todoDoneWeek}</span>
                  </div>
                </div>
              </div>
              <div className="metric-tile">
                <div className="metric-left">
                  <div className="metric-header">
                    <div className="metric-circle">{boards.length}</div>
                    <h3>Kanban Boards</h3>
                  </div>
                  <Sparkline data={boardTrend} />
                  <span className="trend-label">Week Trend</span>
                </div>
                <div className="metric-right metric-detail-grid">
                  <div className="metric-detail">
                    <span className="label">Cards Today</span>
                    <span className="value">{cardsDoneToday}</span>
                  </div>
                  <div className="metric-detail">
                    <span className="label">Cards Week</span>
                    <span className="value">{cardsDoneWeek}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="dashboard-row">
              <DashboardTile
                icon={<span role="img" aria-label="Mindmap">🧠</span>}
                title="Mind Maps"
                items={mapItems}
                moreLink="/mindmaps"
                onCreate={() => {
                  if (maps.length < mindmapLimit) {
                    setCreateType('map')
                    setShowModal(true)
                  } else {
                    alert('Mindmap limit reached')
                  }
                }}
              />
              <DashboardTile
                icon={<span role="img" aria-label="Todos">✅</span>}
                title="Todos"
                items={todoItems}
                listClassName="dashboard-list-preview"
                moreLink="/todos"
                onCreate={() => {
                  if (todoLists.length < todoLimit) {
                    setCreateType('todo')
                    setShowModal(true)
                  } else {
                    alert('Todo list limit reached')
                  }
                }}
              />
              <DashboardTile
                icon={<span role="img" aria-label="Kanban">📋</span>}
                title="Kanban Boards"
                items={boardItems}
                moreLink="/kanban"
                onCreate={() => {
                  if (boards.length < boardLimit) {
                    setCreateType('board')
                    setShowModal(true)
                  } else {
                    alert('Kanban board limit reached')
                  }
                }}
              />
            </div>
          </div>
        </>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal fancy-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <span className="flare-line" aria-hidden="true"></span>
            <h2 className="fade-item">Create {createType === 'map' ? 'Mind Map' : createType === 'todo' ? 'Todo List' : 'Board'}</h2>
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
