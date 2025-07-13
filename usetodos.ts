const TodoSchema = z.object({
  id: z.string(),
  nodeId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
const TodosSchema = z.array(TodoSchema)

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const controllersRef = useRef<Set<AbortController>>(new Set())

  useEffect(() => {
    return () => {
      controllersRef.current.forEach(controller => controller.abort())
      controllersRef.current.clear()
    }
  }, [])

  const loadTodos = useCallback(async (nodeId: string): Promise<Todo[]> => {
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    controllersRef.current.add(controller)
    try {
      const res = await fetch(`/api/node/${encodeURIComponent(nodeId)}/todos`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`Failed to load todos: ${res.status} ${res.statusText}`)
      const json = await res.json()
      const data = TodosSchema.parse(json)
      setTodos(data)
      return data
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw err
      }
      const e = err instanceof Error ? err : new Error('Unknown error')
      setError(e)
      throw e
    } finally {
      controllersRef.current.delete(controller)
      setLoading(false)
    }
  }, [])

  const addTodo = useCallback(
    async (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> => {
      setIsAdding(true)
      setError(null)
      const controller = new AbortController()
      controllersRef.current.add(controller)
      try {
        const res = await fetch('/api/todo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Failed to add todo: ${res.status} ${res.statusText}`)
        const json = await res.json()
        const newTodo = TodoSchema.parse(json)
        setTodos(prev => [...prev, newTodo])
        return newTodo
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err
        }
        const e = err instanceof Error ? err : new Error('Unknown error')
        setError(e)
        throw e
      } finally {
        controllersRef.current.delete(controller)
        setIsAdding(false)
      }
    },
    []
  )

  const updateTodo = useCallback(
    async (todo: Todo): Promise<Todo> => {
      setIsUpdating(true)
      setError(null)
      const controller = new AbortController()
      controllersRef.current.add(controller)
      try {
        const res = await fetch(`/api/todo/${encodeURIComponent(todo.id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Failed to update todo: ${res.status} ${res.statusText}`)
        const json = await res.json()
        const updated = TodoSchema.parse(json)
        setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)))
        return updated
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err
        }
        const e = err instanceof Error ? err : new Error('Unknown error')
        setError(e)
        throw e
      } finally {
        controllersRef.current.delete(controller)
        setIsUpdating(false)
      }
    },
    []
  )

  const deleteTodo = useCallback(
    async (todoId: string): Promise<void> => {
      setIsDeleting(true)
      setError(null)
      const controller = new AbortController()
      controllersRef.current.add(controller)
      try {
        const res = await fetch(`/api/todo/${encodeURIComponent(todoId)}`, {
          method: 'DELETE',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Failed to delete todo: ${res.status} ${res.statusText}`)
        setTodos(prev => prev.filter(t => t.id !== todoId))
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err
        }
        const e = err instanceof Error ? err : new Error('Unknown error')
        setError(e)
        throw e
      } finally {
        controllersRef.current.delete(controller)
        setIsDeleting(false)
      }
    },
    []
  )

  return {
    todos,
    loading,
    isAdding,
    isUpdating,
    isDeleting,
    error,
    loadTodos,
    addTodo,
    updateTodo,
    deleteTodo,
  }
}