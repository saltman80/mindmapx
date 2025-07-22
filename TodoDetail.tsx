import { useState } from 'react'
import { useParams } from 'react-router-dom'

interface Note {
  id: string
  text: string
  author: string
  date: string
}

export default function TodoDetail() {
  const { id } = useParams<{ id: string }>()
  const [notes, setNotes] = useState<Note[]>([])
  const [text, setText] = useState('')
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
    <div className="todo-detail">
      <h1>Todo {id}</h1>
      <ul className="notes-list">
        {notes.map(n => (
          <li key={n.id}>
            <strong>{n.author}</strong>: {n.text} <em>{n.date}</em>
          </li>
        ))}
      </ul>
      <div className="note-form">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Add note" />
        <button onClick={addNote}>Add</button>
      </div>
    </div>
  )
}
