import KanbanLane from './KanbanLane'

interface Props {
  lanes?: string[]
  onCreateBoard?: () => void
}

export default function EmptyKanbanBoard({ lanes = ['To Do', 'In Progress', 'Done'], onCreateBoard }: Props) {

  return (
    <>
      <div className="kanban-board">
        {lanes.map(lane => (
          <KanbanLane key={lane} title={lane} cards={[]} />
        ))}
      </div>
      <div className="modal-overlay empty-canvas-modal">
        <div className="modal">
          {onCreateBoard ? (
            <>
              <p>No board found. Click below to create one.</p>
              <button className="btn-primary" onClick={onCreateBoard}>
                Create Board
              </button>
            </>
          ) : (
            <>
              <p>No cards yet. Click below to add your first card!</p>
              <button className="btn-primary">Add Card</button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
