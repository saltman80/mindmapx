import { useState } from 'react'
import TodoPlaceholder from './TodoPlaceholder'
import Modal from './modal'

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
}

export default function TodoCanvas({
  initialTodos = [],
  nodeId,
  kanbanId,
}: TodoCanvasProps): JSX.Element {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos)
  const isEmpty = todos.length === 0
  const [showModal, setShowModal] = useState(isEmpty)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleCreateTodo = (data: { title: string; description: string }) => {
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      nodeId,
      kanbanId,
    }
    setTodos(prev => [newTodo, ...prev])
    setShowModal(false)
    setTitle('')
    setDescription('')
  }

  return (
    <div className="todo-canvas-wrapper">
      {isEmpty ? (
        <>
          <div className="todo-placeholder-list">
            {Array.from({ length: 5 }).map((_, i) => (
              <TodoPlaceholder key={i} />
            ))}
          </div>
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} ariaLabel="Create todo">
            <form
              onSubmit={e => {
                e.preventDefault()
                handleCreateTodo({ title, description })
              }}
              className="todo-form"
            >
              <h2>Create Todo</h2>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Name"
                required
              />
              <textarea
                className="form-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                style={{ marginTop: '0.5rem' }}
              />
              <div className="form-actions" style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save
                </button>
              </div>
            </form>
          </Modal>
        </>
      ) : (
        <div className="todo-list">
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
        </div>
      )}
    </div>
  )
}
