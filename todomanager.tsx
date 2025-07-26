import { authFetch } from './authFetch'

export default function TodoManager({ todos: initialTodos }: TodoManagerProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionType, setBulkActionType] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState<string>('')
  const [newDescription, setNewDescription] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ title: string; description?: string; assigneeId?: string | null }>({ title: '', description: '', assigneeId: null })
  const isMounted = useRef(true)
  const abortControllers = useRef<AbortController[]>([])

  useEffect(() => {
    setTodos(initialTodos)
  }, [])

  useEffect(() => {
    return () => {
      isMounted.current = false
      abortControllers.current.forEach(c => c.abort())
    }
  }, [])

  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos
    const q = searchQuery.toLowerCase()
    return todos.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    )
  }, [todos, searchQuery])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const controller = new AbortController()
    abortControllers.current.push(controller)
    if (isMounted.current) { setLoading(true); setError(null) }
    const input: TodoInput = { title: newTitle.trim() }
    if (newDescription.trim()) input.description = newDescription.trim()
    try {
      const res = await authFetch('/.netlify/functions/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal
      })
      if (!res.ok) throw new Error('Failed to add todo')
      const created: Todo = await res.json()
      if (isMounted.current) {
        setTodos(prev => [created, ...prev])
        setNewTitle('')
        setNewDescription('')
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return
      if (isMounted.current) setError(e.message)
    } finally {
      if (isMounted.current) setLoading(false)
      const idx = abortControllers.current.indexOf(controller)
      if (idx > -1) abortControllers.current.splice(idx, 1)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this todo?')) return
    const controller = new AbortController()
    abortControllers.current.push(controller)
    if (isMounted.current) { setLoading(true); setError(null) }
    try {
      const res = await authFetch(`/.netlify/functions/todoid/${id}`, {
        method: 'DELETE',
        signal: controller.signal
      })
      if (!res.ok) throw new Error('Failed to delete todo')
      if (isMounted.current) {
        setTodos(prev => prev.filter(t => t.id !== id))
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return
      if (isMounted.current) setError(e.message)
    } finally {
      if (isMounted.current) setLoading(false)
      const idx = abortControllers.current.indexOf(controller)
      if (idx > -1) abortControllers.current.splice(idx, 1)
    }
  }

  const handleToggleComplete = async (todo: Todo) => {
    const controller = new AbortController()
    abortControllers.current.push(controller)
    if (isMounted.current) { setLoading(true); setError(null) }
    const updatedCompleted = !todo.completed
    try {
      const res = await authFetch(`/.netlify/functions/todoid/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: updatedCompleted }),
        signal: controller.signal
      })
      if (!res.ok) throw new Error('Failed to update status')
      const data: Todo = await res.json()
      if (isMounted.current) setTodos(prev => prev.map(t => (t.id === data.id ? data : t)))
    } catch (e: any) {
      if (e.name === 'AbortError') return
      if (isMounted.current) setError(e.message)
    } finally {
      if (isMounted.current) setLoading(false)
      const idx = abortControllers.current.indexOf(controller)
      if (idx > -1) abortControllers.current.splice(idx, 1)
    }
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditValues({
      title: todo.title,
      description: todo.description || '',
      assigneeId: todo.assignee_id || null,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues({ title: '', description: '', assigneeId: null })
  }

  const saveEdit = async (id: string) => {
    if (!editValues.title.trim()) return
    const controller = new AbortController()
    abortControllers.current.push(controller)
    if (isMounted.current) { setLoading(true); setError(null) }
    const payload: { title: string; description?: string; assignee_id?: string | null } = {
      title: editValues.title.trim(),
    }
    if (editValues.description.trim()) payload.description = editValues.description.trim()
    if (editValues.assigneeId !== undefined) payload.assignee_id = editValues.assigneeId
    try {
      const res = await authFetch(`/.netlify/functions/todoid/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      if (!res.ok) throw new Error('Failed to update todo')
      const updated: Todo = await res.json()
      if (isMounted.current) {
        setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)))
        cancelEdit()
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return
      if (isMounted.current) setError(e.message)
    } finally {
      if (isMounted.current) setLoading(false)
      const idx = abortControllers.current.indexOf(controller)
      if (idx > -1) abortControllers.current.splice(idx, 1)
    }
  }

  const handleBulkAction = async () => {
    if (!bulkActionType || selectedIds.size === 0) return
    if (bulkActionType === 'delete' && !confirm('Delete selected todos?')) return
    const controller = new AbortController()
    abortControllers.current.push(controller)
    if (isMounted.current) { setLoading(true); setError(null) }
    const ids = Array.from(selectedIds)
      try {
        const res = await authFetch('/.netlify/functions/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action: bulkActionType }),
        signal: controller.signal
      })
      if (!res.ok) throw new Error('Bulk action failed')
      if (isMounted.current) {
        if (bulkActionType === 'delete') {
          setTodos(prev => prev.filter(t => !ids.includes(t.id)))
        } else {
          setTodos(prev =>
            prev.map(t =>
              ids.includes(t.id)
                ? { ...t, completed: bulkActionType === 'complete' }
                : t
            )
          )
        }
        setSelectedIds(new Set())
        setBulkActionType('')
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return
      if (isMounted.current) setError(e.message)
    } finally {
      if (isMounted.current) setLoading(false)
      const idx = abortControllers.current.indexOf(controller)
      if (idx > -1) abortControllers.current.splice(idx, 1)
    }
  }

  return (
    <div className="todo-manager">
      <form onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Title"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newDescription}
          onChange={e => setNewDescription(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>Add Todo</button>
      </form>
      <div className="controls">
        <input
          type="text"
          placeholder="Search todos"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          disabled={loading}
        />
        <select
          value={bulkActionType}
          onChange={e => setBulkActionType(e.target.value)}
          disabled={loading}
        >
          <option value="">Bulk Actions</option>
          <option value="complete">Mark Complete</option>
          <option value="incomplete">Mark Incomplete</option>
          <option value="delete">Delete</option>
        </select>
        <button
          onClick={handleBulkAction}
          disabled={loading || selectedIds.size === 0 || !bulkActionType}
        >
          Apply
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading...</div>}
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Title</th>
            <th>Description</th>
            <th>Status</th>
            <th>Assignee</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTodos.map(todo => (
            <tr key={todo.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(todo.id)}
                  onChange={() => toggleSelect(todo.id)}
                  disabled={loading}
                />
              </td>
              {editingId === todo.id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editValues.title}
                      onChange={e =>
                        setEditValues(v => ({ ...v, title: e.target.value }))
                      }
                      disabled={loading}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editValues.description}
                      onChange={e =>
                        setEditValues(v => ({ ...v, description: e.target.value }))
                      }
                      disabled={loading}
                    />
                  </td>
                  <td>{todo.completed ? 'Completed' : 'Pending'}</td>
                  <td>
                    <input
                      type="text"
                      value={editValues.assigneeId || ''}
                      onChange={e =>
                        setEditValues(v => ({ ...v, assigneeId: e.target.value }))
                      }
                      disabled={loading}
                    />
                  </td>
                  <td>{new Date(todo.created_at).toLocaleString()}</td>
                  <td>
                    <button onClick={() => saveEdit(todo.id)} disabled={loading}>
                      Save
                    </button>
                    <button onClick={cancelEdit} disabled={loading}>
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                <td>{todo.title}</td>
                <td>{todo.description}</td>
                <td>
                  <button
                    onClick={() => handleToggleComplete(todo)}
                    disabled={loading}
                  >
                    {todo.completed ? 'Undo' : 'Complete'}
                  </button>
                </td>
                <td>{todo.assignee_name || todo.assignee_email || 'Unassigned'}</td>
                <td>{new Date(todo.created_at).toLocaleString()}</td>
                  <td>
                    <button onClick={() => startEdit(todo)} disabled={loading}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}