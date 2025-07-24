import KanbanLane from './KanbanLane'
import EmptyKanbanBoard from './EmptyKanbanBoard'

export default function KanbanCanvas({ boardData }: { boardData?: any }) {
  const hasCards = boardData?.lanes?.some((lane: any) => lane.cards?.length > 0)

  if (!hasCards) {
    return <EmptyKanbanBoard />
  }

  return (
    <div className="kanban-board">
      {boardData.lanes.map((lane: any) => (
        <KanbanLane key={lane.id} title={lane.title} cards={lane.cards} />
      ))}
    </div>
  )
}
