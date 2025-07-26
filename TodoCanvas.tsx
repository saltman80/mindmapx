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
  listId?: string
}

export default function TodoCanvas({
  initialTodos = [],
  nodeId,
  kanbanId,
  listId,
}: TodoCanvasProps): JSX.Element {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos)
  const [adding, setAdding] = useState(initialTodos.length === 0)
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const handleCreateTodo = async (title: string) => {
    try {
      const res = await fetch('/.netlify/functions/todos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: '', listId, nodeId }),
      })
      if (!res.ok) throw new Error('Failed to save todo')
      const created: TodoItem = await res.json()
      setTodos(prev => [created, ...prev])
    } catch (err) {
      console.error(err)
      alert('Failed to create todo')
    }
  }

  return (
    <div className="todo-canvas-wrapper">
      {todos.length > 0 && (
        <header className="todo-header">
          <h1>{todos[0].title}</h1>
          {todos[0].description && (
            <p className="todo-description">{todos[0].description}</p>
          )}
          <h2 className="todo-title-below">{todos[0].title}</h2>
        </header>
      )}
      <div className="todo-list">
        {todos.length === 0 && (
          <p className="todo-empty-message">Add a new todo to get started.</p>
        )}
        {todos.map(t => (
          <div key={t.id} className="tile">
            <header className="tile-header">
              <h2>{t.title}</h2>
            </header>
            {t.description && (
              <section className="tile-body">
                <p>{t.description}</p>
              </section>
            )}
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
      </div>
    </div>
  )
}
