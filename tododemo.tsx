import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Link } from 'react-router-dom'
import useScrollReveal from './useScrollReveal'

export default function TodoDemo(): JSX.Element {
  useScrollReveal()
  const [mode, setMode] = useState<Mode>('manual')
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputText, setInputText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const toggleMode = (newMode: Mode) => {
    setMode(newMode)
    setTodos([])
    setInputText('')
    setError('')
    setLoading(false)
  }

  const generateTodosAI = async (): Promise<Todo[]> => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/generateTodos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = (await res.json()) as { todos: string[] }
      return data.todos.map(text => ({ id: uuidv4(), text }))
    } catch (err) {
      console.error(err)
      setError('Could not generate todos. Please try again.')
      return []
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateClick = async () => {
    const aiTodos = await generateTodosAI()
    setTodos(aiTodos)
  }

  const handleAdd = () => {
    const trimmed = inputText.trim()
    if (!trimmed) return
    const newTodo = { id: uuidv4(), text: trimmed }
    setTodos(prev => [...prev, newTodo])
    setInputText('')
  }

  return (
    <div className="todo-demo reveal section section--one-col">
      <div className="mode-toggle">
        <button onClick={() => toggleMode('manual')} disabled={mode === 'manual'}>
          Manual
        </button>
        <button onClick={() => toggleMode('ai')} disabled={mode === 'ai'}>
          AI
        </button>
      </div>
      <div className="mode-content">
        {mode === 'manual' && (
          <div className="manual-mode">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Enter a todo"
            />
            <button onClick={handleAdd} disabled={inputText.trim() === ''}>
              Add Todo
            </button>
          </div>
        )}
        {mode === 'ai' && (
          <div className="ai-mode">
            <button onClick={handleGenerateClick} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Todos'}
            </button>
          </div>
        )}
        {error && <div className="error">{error}</div>}
        {todos.length > 0 && (
          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo.id}>{todo.text}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-md">
        <Link to="/payment" className="btn">Upgrade</Link>
      </div>
    </div>
  )
}