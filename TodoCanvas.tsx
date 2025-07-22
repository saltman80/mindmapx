import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Note {
  id: string
  text: string
  author: string
  date: string
}

interface Todo {
  id: string
  title: string
  assignee?: string
  notes: Note[]
}

export default function TodoCanvas() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [assignee, setAssignee] = useState('')

  const addTodo = () => {
    const t = title.trim()
    if (!t) return
    const newTodo: Todo = {
      id: Date.now().toString(),
      title: t,
      assignee: assignee.trim() || undefined,
      notes: []
    }
    setTodos(prev => [...prev, newTodo])
    setTitle('')
    setAssignee('')
  }

  const removeTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="todo-canvas">
      <div className="todo-form">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Todo title"
        />
        <input
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
          placeholder="Assignee"
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(t => (
          <li key={t.id} className="todo-item">
            <Link to={`/todo/${t.id}`}>{t.title}</Link>
            {t.assignee && <span className="assignee"> - {t.assignee}</span>}
            <button onClick={() => removeTodo(t.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
