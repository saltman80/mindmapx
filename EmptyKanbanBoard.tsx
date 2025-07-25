import KanbanLane, { Card } from './KanbanLane'

interface Props {
  lanes?: string[]
  onCreateBoard?: () => void
}

export default function EmptyKanbanBoard({ lanes = ['To Do', 'In Progress', 'Done'], onCreateBoard }: Props) {

  const scaffoldCards: Card[] = [
    { title: 'Design Landing Page', description: 'Review with UI team', priority: 'high' },
    { title: 'Fix Auth Bug', description: 'Session expiration error', priority: 'medium' },
    { title: 'Write Unit Tests', description: 'Cover core logic', priority: 'low' },
    { title: 'Update Documentation', description: 'Add new endpoint info', priority: 'low' }
  ]

  return (
    <>
      <div className="kanban-board">
        {lanes.map(lane => (
          <KanbanLane key={lane} title={lane} cards={scaffoldCards} />
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
