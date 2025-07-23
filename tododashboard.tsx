import React, { useState, useRef, useCallback, useEffect } from 'react'
import LoadingSkeleton from './loadingskeleton'
import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'

export default function TodoDashboard() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  const loadTodos = useCallback(async () => {
    setError(null)
    setIsLoadingList(true)
    try {
      const res = await fetch('/.netlify/functions/todos', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch todos')
      const data = await res.json()
      if (isMounted.current) setTodos(data.todos)
    } catch (err) {
      if (isMounted.current) {
        const message = err instanceof Error ? err.message : 'Error loading todos'
        setError(message)
      }
    } finally {
      if (isMounted.current) setIsLoadingList(false)
    }
  }, [])

  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const handleFilter = (newFilter: Filter) => {
    setFilter(newFilter)
  }

  const handleBulkComplete = async () => {
    setError(null)
    const ids = todos.filter(t => !t.completed).map(t => t.id)
    if (ids.length === 0) return
    setIsUpdatingBulk(true)
    try {
      const res = await fetch('/.netlify/functions/todos/bulk-complete', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('Bulk complete failed')
      await loadTodos()
    } catch (err) {
      if (isMounted.current) {
        const message = err instanceof Error ? err.message : 'Error completing todos'
        setError(message)
      }
    } finally {
      if (isMounted.current) setIsUpdatingBulk(false)
    }
  }

  const handleClearCompleted = async () => {
    setError(null)
    setIsClearing(true)
    try {
      const res = await fetch('/.netlify/functions/todos/completed', { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error('Clear completed failed')
      await loadTodos()
    } catch (err) {
      if (isMounted.current) {
        const message = err instanceof Error ? err.message : 'Error clearing todos'
        setError(message)
      }
    } finally {
      if (isMounted.current) setIsClearing(false)
    }
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  return (
    <div className="todo-dashboard relative overflow-hidden">
      <MindmapArm side="left" />
      <FaintMindmapBackground className="mindmap-bg-small" />
      <h1 className="dashboard-title"><img src="./assets/logo.png" alt="MindXdo logo" className="dashboard-logo" /> Todos</h1>
      <div className="controls">
        <div className="filters">
          <button disabled={filter === 'all'} onClick={() => handleFilter('all')}>All</button>
          <button disabled={filter === 'active'} onClick={() => handleFilter('active')}>Active</button>
          <button disabled={filter === 'completed'} onClick={() => handleFilter('completed')}>Completed</button>
        </div>
        <button
          onClick={handleBulkComplete}
          disabled={isLoadingList || isUpdatingBulk || todos.every(t => t.completed)}
        >
          {isUpdatingBulk ? 'Completing...' : 'Complete All'}
        </button>
        <button
          onClick={handleClearCompleted}
          disabled={isLoadingList || isClearing || !todos.some(t => t.completed)}
        >
          {isClearing ? 'Clearing...' : 'Clear Completed'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {isLoadingList ? (
        <LoadingSkeleton />
      ) : (
        <ul className="todo-list">
          {filteredTodos.map(todo => (
            <li key={todo.id} className={todo.completed ? 'completed' : ''}>
              {todo.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}