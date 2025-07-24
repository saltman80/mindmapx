import { useState } from 'react'
import KanbanLane from './KanbanLane'
import EmptyKanbanBoard from './EmptyKanbanBoard'
import Modal from './modal'

interface Props {
  boardData?: any
  nodeId?: string
  todoId?: string
}

export default function KanbanCanvas({ boardData, nodeId, todoId }: Props) {
  const [board, setBoard] = useState(boardData)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const createBoard = async () => {
    try {
      const res = await fetch('/.netlify/functions/boards', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, nodeId, todoId }),
      })
      const json = await res.json()
      if (json?.boardId || json?.id) {
        setBoard({
          id: json.boardId || json.id,
          lanes: [
            { id: 'lane-new', title: 'New', cards: [] },
            { id: 'lane-progress', title: 'In Progress', cards: [] },
            { id: 'lane-review', title: 'Review', cards: [] },
            { id: 'lane-complete', title: 'Complete', cards: [] },
          ],
        })
      }
      setShowModal(false)
      setTitle('')
      setDescription('')
    } catch (err) {
      console.error(err)
    }
  }

  const activeBoard = board
  const hasCards = activeBoard?.lanes?.some((lane: any) => lane.cards?.length > 0)

  if (!activeBoard) {
    return (
      <>
        <EmptyKanbanBoard onCreateBoard={() => setShowModal(true)} />
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} ariaLabel="Create board">
          <form
            onSubmit={e => {
              e.preventDefault()
              createBoard()
            }}
          >
            <h2>Create Board</h2>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Name"
              required
            />
            <textarea
              className="form-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              style={{ marginTop: '0.5rem' }}
            />
            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </form>
        </Modal>
      </>
    )
  }

  if (!hasCards) {
    return <EmptyKanbanBoard lanes={activeBoard.lanes.map((l: any) => l.title)} />
  }

  return (
    <div className="kanban-board">
      {activeBoard.lanes.map((lane: any) => (
        <KanbanLane key={lane.id} title={lane.title} cards={lane.cards} />
      ))}
    </div>
  )
}
