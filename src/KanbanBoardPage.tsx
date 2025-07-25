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

export default function KanbanBoardPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [boardData, setBoardData] = useState<Board | null>(null)

  useEffect(() => {
    if (!id) return
    authFetch(`/.netlify/functions/boards?id=${id}`)
      .then(res => res.json())
      .then(data => setBoardData(data.board))
      .catch(err => {
        console.error('Error loading kanban board', err)
        setBoardData(null)
      })
  }, [id])

  return (
    <div className="dashboard-layout">
      <main className="main-area">
        <header className="kanban-header">
          <div className="kanban-header-info">
            <div className="kanban-icon" aria-hidden="true">🗂️</div>
            <div>
              <h1 className="kanban-title">{boardData?.title || 'Kanban Board'}</h1>
              {boardData?.description && (
                <p className="kanban-description">{boardData.description}</p>
              )}
            </div>
          </div>
          <div className="kanban-header-actions">
            <button aria-label="Settings">⋯</button>
          </div>
        </header>
        <KanbanCanvas boardData={boardData} />
      </main>
    </div>
  )
}
