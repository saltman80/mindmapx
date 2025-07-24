import { useState, useEffect } from 'react'
import { authFetch } from '../authFetch'
import TodoCanvas from '../TodoCanvas'

export default function TodoEditorPage(): JSX.Element {
  const [todos, setTodos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/.netlify/functions/todos')
      .then(res => res.json())
      .then(data => {
        setTodos(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setTodos([])
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading...</p>

  return <TodoCanvas initialTodos={todos} />
}
