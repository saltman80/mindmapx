import { useState, useRef, useEffect } from 'react'
import CommentsModal from './CommentsModal'
import TodoModal from './TodoModal'
import Modal from './modal'
import type { Comment } from './CardModal'

export interface TodoItem {
  id: string
  title: string
  description: string
  nodeId?: string
  kanbanId?: string
  assignee?: string
  comments?: Comment[]
}

export interface TodoCanvasProps {
  initialTodos?: TodoItem[]
  nodeId?: string
  kanbanId?: string
  list_id?: string
  listTitle?: string
  listDescription?: string
}

export default function TodoCanvas({
  initialTodos = [],
  nodeId,
  kanbanId,
  list_id,
  listTitle,
  listDescription,
}: TodoCanvasProps): JSX.Element {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null)
  const [commentingTodo, setCommentingTodo] = useState<TodoItem | null>(null)
  const [sendingTodo, setSendingTodo] = useState<TodoItem | null>(null)
  const [boards, setBoards] = useState<{ id: string; title: string }[]>([])
  const [selectedBoard, setSelectedBoard] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [adding, setAdding] = useState(true)

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
    await fetch(`/.netlify/functions/todoid/${todo.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: todo.title,
        completed: (todo as any).completed,
      }),
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

  const handleModalSave = async (updated: TodoItem) => {
    setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)))
    setEditingTodo(null)
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

  const openEditModal = (todo: TodoItem) => {
    setEditingTodo(todo)
  }

  const openCommentPanel = (todo: TodoItem) => {
    setCommentingTodo(todo)
  }

  const openKanbanSendDialog = async (todo: TodoItem) => {
    setSendingTodo(todo)
    try {
      const res = await fetch('/.netlify/functions/boards', { credentials: 'include' })
      const data = await res.json()
      if (Array.isArray(data.boards)) setBoards(data.boards)
    } catch {
      setBoards([])
    }
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
  const totalCount = todos.length
  const completedCount = todos.filter(t => (t as any).completed).length
  const [showAll, setShowAll] = useState(false)

  const renderTodo = (t: TodoItem & { completed?: boolean }) => (
    <div key={t.id} className={`todo-block ${t.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={t.completed || false}
        onChange={() => handleToggleCompleted(t as any)}
        className="todo-checkbox"
      />
      {editingId === t.id ? (
        <input
          className="todo-edit-input"
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onBlur={() => saveEdit(t)}
          onKeyDown={e => e.key === 'Enter' && saveEdit(t)}
          autoFocus
        />
      ) : (
        <span className="todo-text" onClick={() => startEditing(t)}>
          {t.title}
        </span>
      )}
      <div className="todo-icons">
        <button className="circle-icon" onClick={() => openEditModal(t)}>
          <span role="img" aria-label="Edit">✏️</span>
        </button>
        <button className="circle-icon" onClick={() => openCommentPanel(t)}>
          <span role="img" aria-label="Comment">💬</span>
        </button>
        <button className="circle-icon" onClick={() => openKanbanSendDialog(t)}>
          <span role="img" aria-label="Send">➡</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="todo-canvas-wrapper">
      {listTitle && (
        <>
          <img src="/assets/logo.png" alt="MindXdo" className="todo-logo" />
          <h1 className="todo-title">{listTitle}</h1>
        </>
      )}
      {listDescription && (
        <p className="todo-description">{listDescription}</p>
      )}
      <h3 className="todo-progress">
        {completedCount}/{totalCount} completed
      </h3>
      <div className="todo-list">
        {activeTodos.map(renderTodo)}
      </div>
      {!adding && (
        <button className="todo-add-circle" onClick={() => setAdding(true)}>+
        </button>
      )}
      {adding && (
        <div className="todo-add-block">
          <form
            className="todo-add-form"
            onSubmit={e => {
              e.preventDefault()
              if (!newTitle.trim()) return
              handleCreateTodo(newTitle.trim())
              setNewTitle('')
            }}
          >
            <input
              type="text"
              className="todo-add-input"
              placeholder="New todo"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
            />
            <button type="submit" className="todo-add-button">Add</button>
          </form>
          <div className="done-link" onClick={() => setAdding(false)}>
            done adding todos
          </div>
        </div>
      )}

      {doneTodos.length > 0 && (
        <>
          <hr className="todo-divider" />
          <h4 className="done-heading">{doneTodos.length} done</h4>
          {doneTodos
            .slice(0, showAll ? doneTodos.length : 2)
            .map(renderTodo)}
          {doneTodos.length > 2 && !showAll && (
            <button className="show-more" onClick={() => setShowAll(true)}>
              Show more...
            </button>
          )}
        </>
      )}
      <TodoModal
        todo={editingTodo}
        onClose={() => setEditingTodo(null)}
        onSave={handleModalSave}
      />
      <CommentsModal
        card={commentingTodo ? { ...commentingTodo, comments: commentingTodo.comments || [], id: commentingTodo.id, title: commentingTodo.title } : null}
        onClose={() => setCommentingTodo(null)}
        onAdd={c => {
          if (commentingTodo) {
            const updated = {
              ...commentingTodo,
              comments: [...(commentingTodo.comments || []), c],
            }
            setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)))
            setCommentingTodo(updated)
          }
        }}
      />
      {sendingTodo && (
        <Modal isOpen={true} onClose={() => setSendingTodo(null)} ariaLabel="Send to kanban">
          <div className="modal-container card-modal">
            <h2 className="mb-2 text-lg font-semibold">Send to Kanban</h2>
            <select value={selectedBoard} onChange={e => setSelectedBoard(e.target.value)} className="input-styled">
              <option value="">Select board</option>
              {boards.map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            <div className="card-actions" style={{ marginTop: '1rem' }}>
              <button className="btn-cancel" onClick={() => setSendingTodo(null)}>Cancel</button>
              <button
                className="btn-save"
                disabled={!selectedBoard}
                onClick={async () => {
                  if (!sendingTodo) return
                  await fetch('/.netlify/functions/kanban-items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      title: sendingTodo.title,
                      description: sendingTodo.description,
                      list_id: selectedBoard,
                      metadata: { from: 'todo', todo_id: sendingTodo.id },
                    }),
                  })
                  setSendingTodo(null)
                }}
              >
                Send
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
