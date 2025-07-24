import KanbanCard from './KanbanCard'

export default function KanbanLane({ title, cards = [] }: { title: string; cards?: string[] }) {
  return (
    <div className="kanban-lane">
      <h3 className="lane-title">{title}</h3>
      {cards.length === 0 ? (
        <KanbanCard title="(Empty)" />
      ) : (
        cards.map((card, i) => <KanbanCard key={i} title={card} />)
      )}
      <button className="btn-secondary">Add Card</button>
    </div>
  )
}
