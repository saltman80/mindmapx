import TodoPlaceholder from './TodoPlaceholder'
import AddTodoButton from './AddTodoButton'

export default function TodoCanvas({ todos }: { todos: any[] }): JSX.Element {
  const isEmpty = !Array.isArray(todos) || todos.length === 0

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
              <AddTodoButton />
            </div>
          </div>
        </>
      ) : (
        <div className="todo-list">
          {todos.map(t => (
            <div key={t.id} className="tile">
              <header className="tile-header">
                <h2>{t.title || t.content || 'Untitled'}</h2>
              </header>
              <section className="tile-body">
                <p>{t.content || 'Todo details...'}</p>
              </section>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
