import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import KanbanCanvas from '../KanbanCanvas'
import { authFetch } from '../authFetch'

interface Board {
  id: string
  title?: string
  description?: string
  created_at?: string
}

interface Column {
  id: string
  title: string
  position: number
}

interface CardItem {
  id: string
  column_id: string
  title: string
  description?: string
  status?: string
  priority?: string
  due_date?: string
  assignee_id?: string
  position: number
}

export default function KanbanBoardPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [boardData, setBoardData] = useState<Board | null>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [cards, setCards] = useState<CardItem[]>([])

  useEffect(() => {
    if (!id) return
    authFetch(`/.netlify/functions/boards?id=${id}`)
      .then(res => res.json())
      .then(data => setBoardData(data.board))
      .catch(err => {
        console.error('Error loading kanban board', err)
        setBoardData(null)
      })
    authFetch(`/.netlify/functions/kanban-board-data?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setColumns(Array.isArray(data.columns) ? data.columns : [])
        setCards(Array.isArray(data.cards) ? data.cards : [])
      })
      .catch(err => {
        console.error('Error loading board data', err)
        setColumns([])
        setCards([])
      })
  }, [id])

  return (
    <div className="dashboard-layout">
      <main className="main-area">
        <KanbanCanvas
          boardData={boardData}
          boardId={id}
          columns={columns}
          cards={cards}
        />
      </main>
    </div>
  )
}
