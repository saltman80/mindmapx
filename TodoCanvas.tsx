import { useState } from 'react'
import TodoPlaceholder from './TodoPlaceholder'
import AddTodoButton from './AddTodoButton'

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

  const handleCreateTodo = (data: { title: string; description: string }) => {
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      nodeId,
      kanbanId,
    }
    setTodos(prev => [newTodo, ...prev])
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
          <div className="modal-overlay empty-canvas-modal">
            <div className="modal">
              <p>No todos yet. Click below to add your first todo!</p>
              <AddTodoButton onCreate={handleCreateTodo} />
            </div>
          </div>
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
