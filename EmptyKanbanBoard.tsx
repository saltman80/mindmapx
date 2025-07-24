import KanbanLane from './KanbanLane'

export default function EmptyKanbanBoard() {
  const lanes = ['To Do', 'In Progress', 'Done']

  return (
    <div className="kanban-board">
      {lanes.map(lane => (
        <KanbanLane key={lane} title={lane} cards={[]} />
      ))}
    </div>
  )
}
