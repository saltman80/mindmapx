import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import SidebarNav from './src/SidebarNav'
import { authFetch } from './authFetch'

interface Note {
  id: string
  text: string
  author: string
  date: string
}

export default function TodoDetail() {
  const { id } = useParams<{ id: string }>()
  const [todo, setTodo] = useState<{ title?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    authFetch(`/.netlify/functions/todoid/${id}`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to load todo')
        const json = await res.json()
        setTodo(json)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const addNote = () => {
    const t = text.trim()
    if (!t) return
    setNotes(prev => [
      ...prev,
      { id: Date.now().toString(), text: t, author: 'me', date: new Date().toISOString() }
    ])
    setText('')
  }
  return (
    <div className="dashboard-layout">
      <SidebarNav />
      <main className="main-area todo-detail">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <>
            <h1>{todo?.title || `Todo ${id}`}</h1>
            <ul className="notes-list">
              {notes.map(n => (
                <li key={n.id}>
                  <strong>{n.author}</strong>: {n.text} <em>{n.date}</em>
                </li>
              ))}
            </ul>
            <div className="note-form">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Add note"
              />
              <button onClick={addNote}>Add</button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
