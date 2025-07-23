const NodeTodoList: FC<NodeTodoListProps> = ({ nodeId }) => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isEditingLoading, setIsEditingLoading] = useState(false)
  const [deletingIds, setDeletingIds] = useState<string[]>([])
  const [togglingIds, setTogglingIds] = useState<string[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const fetchTodos = async () => {
      try {
        const res = await fetch(
          `/.netlify/functions/todos?nodeId=${encodeURIComponent(nodeId)}`,
          { signal: controller.signal }
        )
        if (!res.ok) throw new Error(`Error fetching todos: ${res.statusText}`)
        const data: Todo[] = await res.json()
        setTodos(data)
      } catch (error: any) {
        if (error.name === 'AbortError') return
        console.error('Failed to load todos', error)
        alert('Failed to load todos')
      }
    }
    fetchTodos()
    return () => {
      controller.abort()
    }
  }, [nodeId])

  const handleAddTodo = async () => {
    const text = newTitle.trim()
    if (!text) return
    setIsAdding(true)
    try {
      const res = await fetch('/.netlify/functions/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nodeId, title: text }),
      })
      if (!res.ok) throw new Error(`Error adding todo: ${res.statusText}`)
      const created: Todo = await res.json()
      setTodos(prev => [...prev, created])
      setNewTitle('')
    } catch (error: any) {
      console.error('Failed to add todo', error)
      alert('Failed to add todo')
    } finally {
      setIsAdding(false)
    }
  }

  const handleGenerateAI = async () => {
    const prompt = aiPrompt.trim()
    if (!prompt) return
    setIsGenerating(true)
    try {
      const res = await fetch('/.netlify/functions/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nodeId, prompt }),
      })
      if (!res.ok) throw new Error(`Error generating todos: ${res.statusText}`)
      const created: Todo[] = await res.json()
      setTodos(prev => [...prev, ...created])
      setAiPrompt('')
    } catch (error: any) {
      console.error('Failed to generate todos', error)
      alert('Failed to generate todos')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditTodo = async (id: string) => {
    const text = editingTitle.trim()
    if (!text) return
    setIsEditingLoading(true)
    try {
      const res = await fetch(`/.netlify/functions/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: text }),
      })
      if (!res.ok) throw new Error(`Error editing todo: ${res.statusText}`)
      setTodos(prev => prev.map(t => (t.id === id ? { ...t, title: text } : t)))
      setEditingId(null)
      setEditingTitle('')
    } catch (error: any) {
      console.error('Failed to edit todo', error)
      alert('Failed to edit todo')
    } finally {
      setIsEditingLoading(false)
    }
  }

  const handleDeleteTodo = async (id: string) => {
    setDeletingIds(prev => [...prev, id])
    try {
      const res = await fetch(`/.netlify/functions/todos/${id}`, { method: 'DELETE', credentials: 'include' })
      if (!res.ok) throw new Error(`Error deleting todo: ${res.statusText}`)
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (error: any) {
      console.error('Failed to delete todo', error)
      alert('Failed to delete todo')
    } finally {
      setDeletingIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleToggleComplete = async (id: string) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    const newStatus = !todo.completed
    setTogglingIds(prev => [...prev, id])
    try {
      const res = await fetch(`/.netlify/functions/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: newStatus }),
      })
      if (!res.ok) throw new Error(`Error toggling todo: ${res.statusText}`)
      setTodos(prev =>
        prev.map(t => (t.id === id ? { ...t, completed: newStatus } : t))
      )
    } catch (error: any) {
      console.error('Failed to toggle todo', error)
      alert('Failed to update todo')
    } finally {
      setTogglingIds(prev => prev.filter(i => i !== id))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="New todo"
        />
        <button onClick={handleAddTodo} disabled={isAdding || !newTitle.trim()}>
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={aiPrompt}
          onChange={e => setAiPrompt(e.target.value)}
          placeholder="AI generate todos"
        />
        <button onClick={handleGenerateAI} disabled={isGenerating || !aiPrompt.trim()}>
          {isGenerating ? 'Generating...' : 'Generate AI'}
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map(todo => {
          const isDeleting = deletingIds.includes(todo.id)
          const isToggling = togglingIds.includes(todo.id)
          const isEditingThis = editingId === todo.id
          return (
            <li
              key={todo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleComplete(todo.id)}
                disabled={isToggling}
              />
              {isEditingThis ? (
                <>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    disabled={isEditingLoading}
                  />
                  <button onClick={() => handleEditTodo(todo.id)} disabled={isEditingLoading}>
                    {isEditingLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null)
                      setEditingTitle('')
                    }}
                    disabled={isEditingLoading}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    style={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      flexGrow: 1,
                    }}
                  >
                    {todo.title}
                  </span>
                  <button
                    onClick={() => {
                      setEditingId(todo.id)
                      setEditingTitle(todo.title)
                    }}
                    disabled={isDeleting || isToggling}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleDeleteTodo(todo.id)} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default NodeTodoList