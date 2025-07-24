import KanbanLane from './KanbanLane'

export default function EmptyKanbanBoard() {
  const lanes = ['To Do', 'In Progress', 'Done']

  return (
    <>
      <div className="kanban-board">
        {lanes.map(lane => (
          <KanbanLane key={lane} title={lane} cards={[]} />
        ))}
      </div>
      <div className="modal-overlay empty-canvas-modal">
        <div className="modal">
          <p>No cards yet. Click below to add your first card!</p>
          <button className="btn-primary">Add Card</button>
        </div>
      </div>
    </>
  )
}
