import { useState, useRef, useEffect } from 'react'

export interface TodoItem {
  id: string
  title: string
  description: string
  nodeId?: string
  kanbanId?: string
}

export interface TodoCanvasProps {
  initialTodos?: TodoItem[]
  nodeId?: string
  kanbanId?: string
  list_id?: string
  listTitle?: string
}

export default function TodoCanvas({
  initialTodos = [],
  nodeId,
  kanbanId,
  list_id,
  listTitle,
}: TodoCanvasProps): JSX.Element {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos)
  const [adding, setAdding] = useState(initialTodos.length === 0)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  useEffect(() => {
    if (!list_id) return
    fetch(`/.netlify/functions/todos?list_id=${encodeURIComponent(list_id)}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTodos(data)
      })
      .catch(err => {
        console.error('Failed to load todos', err)
      })
  }, [list_id])

  const handleCreateTodo = async (title: string) => {
    try {
      const res = await fetch('/.netlify/functions/todos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: '', list_id, nodeId }),
      })
      if (!res.ok) throw new Error('Failed to save todo')
      const created: TodoItem = await res.json()
      setTodos(prev => [created, ...prev])
    } catch (err) {
      console.error(err)
      alert('Failed to create todo')
    }
  }

  const saveTodoUpdate = async (todo: TodoItem) => {
    await fetch('/.netlify/functions/todos', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: todo.id, updates: { title: todo.title, completed: (todo as any).completed } }),
    })
  }

  const handleToggleCompleted = async (todo: TodoItem & { completed?: boolean }) => {
    const updated = { ...todo, completed: !todo.completed }
    setTodos(prev => prev.map(t => (t.id === todo.id ? updated : t)))
    try {
      await saveTodoUpdate(updated)
    } catch (err) {
      console.error(err)
    }
  }

  const startEditing = (todo: TodoItem) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
  }

  const saveEdit = async (todo: TodoItem) => {
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === todo.title) {
      setEditingId(null)
      return
    }
    const updated = { ...todo, title: trimmed }
    setTodos(prev => prev.map(t => (t.id === todo.id ? updated : t)))
    setEditingId(null)
    try {
      await saveTodoUpdate(updated)
    } catch (err) {
      console.error(err)
    }
  }

  const activeTodos = todos.filter(t => !(t as any).completed)
  const doneTodos = todos.filter(t => (t as any).completed)

  return (
    <div className="todo-canvas-wrapper">
      {listTitle && (
        <header className="todo-header">
          <h1>{listTitle}</h1>
        </header>
      )}
      <div className="todo-list">
        {activeTodos.map(t => (
          <div key={t.id} className="tile todo-item">
            <div className="tile-header">
              <input
                type="checkbox"
                checked={(t as any).completed || false}
                onChange={() => handleToggleCompleted(t as any)}
              />
              {editingId === t.id ? (
                <input
                  className="editable-title"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onBlur={() => saveEdit(t)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(t)}
                  autoFocus
                />
              ) : (
                <span className="todo-title" onClick={() => startEditing(t)}>
                  {t.title}
                </span>
              )}
            </div>
          </div>
        ))}

        {adding && (
          <>
            <form
              onSubmit={e => {
                e.preventDefault()
                const text = newTitle.trim()
                if (!text) return
                handleCreateTodo(text).then(() => setNewTitle(''))
              }}
              className="todo-add-form"
            >
              <input
                ref={inputRef}
                type="text"
                className="form-input"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="New todo"
              />
              <button type="submit" className="btn-primary">
                Add
              </button>
            </form>
            <button
              type="button"
              className="done-adding-link"
              onClick={() => {
                setAdding(false)
                setNewTitle('')
              }}
            >
              done adding todos
            </button>
          </>
        )}
        {!adding && (
          <button
            type="button"
            className="todo-add-circle"
            onClick={() => setAdding(true)}
            aria-label="Add todo"
          >
            +
          </button>
        )}

        {doneTodos.length > 0 && (
          <>
            <hr className="done-divider" />
            <h3 className="done-header">Done</h3>
            {doneTodos.map(t => (
              <div key={t.id} className="tile todo-item completed">
                <div className="tile-header">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => handleToggleCompleted(t as any)}
                  />
                  <span className="todo-title done-text">{t.title}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
