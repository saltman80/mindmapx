import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import TodoCanvas from '../TodoCanvas'
import { authFetch } from '../authFetch'

interface TodoItem {
  id: string
  title: string
  description?: string
  completed?: boolean
}

interface TodoList {
  id: string | null
  title: string
  description?: string
  todos: TodoItem[]
  mindmap_id?: string | null
}

export default function TodosCanvasPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [list, setList] = useState<TodoList | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    authFetch('/.netlify/functions/todo-lists', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const arr: TodoList[] = Array.isArray(data) ? data : []
        const found = arr.find(l => l.id === id)
        if (!found) {
          setError('List not found')
          return
        }
        setList(found)
      })
      .catch(() => setError('Failed to load list'))
  }, [id])

  return (
    <div className="dashboard-layout">
      <main className="main-area">
        {error ? (
          <p className="error">{error}</p>
        ) : (
          <TodoCanvas
            initialTodos={list?.todos ?? []}
            list_id={id}
            listTitle={list?.title}
            listDescription={list?.description}
            mindmapId={list?.mindmap_id || undefined}
          />
        )}
      </main>
    </div>
  )
}
