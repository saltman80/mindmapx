import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'

interface TodoItem {
  id: string
  title: string
  completed: boolean
}

interface TodoList {
  id: string | null
  title: string
  todos: TodoItem[]
}

export default function TodosPage(): JSX.Element {
  const [lists, setLists] = useState<TodoList[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState('')
  const navigate = useNavigate()

  const fetchLists = async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/todo-lists', {
        credentials: 'include',
      })
      const data = await res.json()
      const arr: TodoList[] = Array.isArray(data) ? data : []
      arr.sort((a, b) => (a.id === null ? 1 : 0) - (b.id === null ? 1 : 0))
      setLists(arr)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  const handleCreateList = async (): Promise<void> => {
    const title = newTitle.trim()
    if (!title) return
    const res = await fetch('/.netlify/functions/todo-lists', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!res.ok) return
    const list = await res.json()
    setLists(prev => [list, ...prev])
    setNewTitle('')
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

  return (
    <div className="todo-dashboard relative overflow-hidden">
      <MindmapArm side="left" />
      <FaintMindmapBackground className="mindmap-bg-small" />
      <h1 className="dashboard-title">
        <img src="./assets/logo.png" alt="MindXdo logo" className="dashboard-logo" /> Todos
      </h1>
      <div className="mb-4">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New list"
        />
        <button onClick={handleCreateList}>Add</button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="todo-lists-grid">
          {lists.map(list => (
            <div key={list.id || 'unassigned'} className="todo-card">
              <div className="card-header">
                <h3>{list.title}</h3>
                {list.id && (
                  <>
                    <button className="open-btn" onClick={() => navigate(`/todos/${list.id}`)}>
                      Open
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteList(list.id!)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
              <ul className="todo-list">
                {list.todos.map(t => (
                  <li key={t.id}>{t.title}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
