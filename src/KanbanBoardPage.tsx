import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import KanbanCanvas from '../KanbanCanvas'
import { authFetch } from '../authFetch'

interface BoardItem {
  id: string
  title?: string
  created_at?: string
}

export default function KanbanBoardPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const boardId = id || ''
  const [board, setBoard] = useState<BoardItem | null>(null)

  useEffect(() => {
    if (!boardId) return
    let ignore = false
    authFetch(`/.netlify/functions/boards?id=${boardId}`)
      .then(async res => {
        if (!ignore && res.ok) {
          const json = await res.json()
          setBoard(json.board || null)
        }
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [boardId])

  if (!boardId) return <div>No board specified</div>

  return (
    <div className="kanban-board-page">
      <h1>{board?.title || 'Kanban Board'}</h1>
      <KanbanCanvas />
    </div>
  )
}
