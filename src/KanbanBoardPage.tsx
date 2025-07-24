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
  const [boardData, setBoardData] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    authFetch(`/.netlify/functions/boards?id=${id}`)
      .then(res => res.json())
      .then(data => setBoardData(data))
      .catch(err => {
        console.error('Error loading kanban board', err)
        setBoardData(null)
      })
  }, [id])

  return (
    <div className="dashboard-layout">
      <main className="main-area">
        <KanbanCanvas boardData={boardData} />
      </main>
    </div>
  )
}
