async function loadTodos(mindmapId: string, signal?: AbortSignal): Promise<Todo[]> {
  const res = await fetch(`/.netlify/functions/getTodos?mindmapId=${mindmapId}`, { signal })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to load todos')
  }
  const data = await res.json()
  return data.todos as Todo[]
}

async function generateAIPrompt(prompt: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`/.netlify/functions/generateAIPrompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to generate AI prompt')
  }
  const data = await res.json()
  return data.prompt as string
}

interface TodoPageProps {
  mindmapId: string
}

export default function TodoPage({ mindmapId }: TodoPageProps) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const [promptInput, setPromptInput] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null)
  const [editedTitle, setEditedTitle] = useState('')
  const abortControllers = useRef<AbortController[]>([])

  useEffect(() => {
    const controller = new AbortController()
    abortControllers.current.push(controller)
    setLoading(true)
    setError(null)
    loadTodos(mindmapId, controller.signal)
      .then(fetched => {
        setTodos(fetched)
        setError(null)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        setLoading(false)
        abortControllers.current = abortControllers.current.filter(c => c !== controller)
      })
    return () => {
      controller.abort()
      abortControllers.current = abortControllers.current.filter(c => c !== controller)
    }
  }, [mindmapId])

  useEffect(() => {
    return () => {
      abortControllers.current.forEach(c => c.abort())
      abortControllers.current = []
    }
  }, [])

  async function handleTodoAdd(e: React.FormEvent) {
    e.preventDefault()
    const title = newTodoTitle.trim()
    if (!title) return
    setError(null)
    const controller = new AbortController()
    abortControllers.current.push(controller)
    try {
      const res = await fetch(`/.netlify/functions/createTodo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mindmapId, title } as TodoInput),
        signal: controller.signal,
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Failed to add todo')
      }
      const data = await res.json()
      setTodos(prev => [...prev, data.todo as Todo])
      setNewTodoTitle('')
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      abortControllers.current = abortControllers.current.filter(c => c !== controller)
    }
  }

  async function handleTodoUpdate(todo: Todo) {
    setError(null)
    const controller = new AbortController()
    abortControllers.current.push(controller)
    try {
      const res = await fetch(`/.netlify/functions/updateTodo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
        signal: controller.signal,
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Failed to update todo')
      }
      const data = await res.json()
      const updated = data.todo as Todo
      setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)))
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      abortControllers.current = abortControllers.current.filter(c => c !== controller)
    }
  }

  async function handleTodoDelete(id: string) {
    setError(null)
    const controller = new AbortController()
    abortControllers.current.push(controller)
    try {
      const res = await fetch(`/.netlify/functions/deleteTodo`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        signal: controller.signal,
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Failed to delete todo')
      }
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      abortControllers.current = abortControllers.current.filter(c => c !== controller)
    }
  }

  async function handleGeneratePrompt(e: React.FormEvent) {
    e.preventDefault()
    const prompt = promptInput.trim()
    if (!prompt) return
    setError(null)
    setIsGenerating(true)
    const controller = new AbortController()
    abortControllers.current.push(controller)
    try {
      const result = await generateAIPrompt(prompt, controller.signal)
      setAiResult(result)
    } catch (err: any) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setIsGenerating(false)
      abortControllers.current = abortControllers.current.filter(c => c !== controller)
    }
  }

  return (
    <div>
      <h1>Todos for {mindmapId}</h1>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul>
          {todos.map(todo => (
            <li key={todo.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleTodoUpdate({ ...todo, completed: !todo.completed })}
              />
              {editingTodoId === todo.id ? (
                <>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={e => setEditedTitle(e.target.value)}
                    style={{ margin: '0 8px', flexGrow: 1 }}
                  />
                  <button
                    onClick={() => {
                      const trimmed = editedTitle.trim()
                      if (trimmed && trimmed !== todo.title) {
                        handleTodoUpdate({ ...todo, title: trimmed })
                      }
                      setEditingTodoId(null)
                    }}
                  >
                    Save
                  </button>
                  <button onClick={() => setEditingTodoId(null)} style={{ marginLeft: '4px' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    style={{
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      margin: '0 8px',
                      flexGrow: 1,
                    }}
                  >
                    {todo.title}
                  </span>
                  <button
                    onClick={() => {
                      setEditingTodoId(todo.id)
                      setEditedTitle(todo.title)
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => handleTodoDelete(todo.id)} style={{ marginLeft: '8px' }}>
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleTodoAdd} style={{ marginTop: '16px' }}>
        <input
          type="text"
          value={newTodoTitle}
          onChange={e => setNewTodoTitle(e.target.value)}
          placeholder="New todo"
          style={{ marginRight: '8px' }}
        />
        <button type="submit">Add Todo</button>
      </form>
      <hr style={{ margin: '24px 0' }} />
      <h2>Generate AI Prompt</h2>
      <form onSubmit={handleGeneratePrompt}>
        <textarea
          value={promptInput}
          onChange={e => setPromptInput(e.target.value)}
          placeholder="Enter your prompt..."
          rows={4}
          style={{ width: '100%', marginBottom: '8px' }}
        />
        <button type="submit" disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </form>
      {aiResult && (
        <div className="ai-result" style={{ marginTop: '16px' }}>
          <h3>AI Result</h3>
          <p>{aiResult}</p>
        </div>
      )}
    </div>
  )
}