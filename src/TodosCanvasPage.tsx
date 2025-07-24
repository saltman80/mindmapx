import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import TodoCanvas from '../TodoCanvas'
import { authFetch } from '../authFetch'

export default function TodosCanvasPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [todo, setTodo] = useState<any | null>(null)

  useEffect(() => {
    if (!id) return
    authFetch(`/.netlify/functions/todoid/${id}`)
      .then(async res => {
        if (!res.ok) return null
        const data = await res.json().catch(() => null)
        return data && !('error' in data) ? data : null
      })
      .then(setTodo)
      .catch(() => setTodo(null))
  }, [id])

  return (
    <div className="dashboard-layout">
      <main className="main-area">
        <TodoCanvas initialTodos={todo ? [todo] : []} />
      </main>
    </div>
  )
}
