export interface Card {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
}

export default function KanbanLane({ title, cards = [] }: { title: string; cards?: Card[] }) {
  return (
    <div className="lane">
      <h3 className="lane-title">{title}</h3>
      {cards.map((card, i) => (
        <div className="card" key={i}>
          <div className="card-header">
            {card.priority && (
              <span className={`priority ${card.priority}`}>{card.priority.toUpperCase()}</span>
            )}
          </div>
          <h4 className="card-title">{card.title}</h4>
          {card.description && <p className="card-description">{card.description}</p>}
        </div>
      ))}
    </div>
  )
}
