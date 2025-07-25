import { useState } from 'react'

interface Card {
  id: string
  title: string
}

interface Lane {
  id: string
  title: string
  cards: Card[]
}

export default function InteractiveKanbanBoard() {
  const [lanes, setLanes] = useState<Lane[]>([
    { id: 'lane-1', title: 'New', cards: [] },
    { id: 'lane-2', title: 'In-Progress', cards: [] },
    { id: 'lane-3', title: 'Reviewing', cards: [] },
    { id: 'lane-4', title: 'Done', cards: [] }
  ])
  const [boardTitle] = useState('Kanban Board')
  const [boardDescription] = useState('Organize tasks across lanes')

  const addLane = () => {
    const id = `lane-${Date.now()}`
    setLanes([...lanes, { id, title: 'New Lane', cards: [] }])
  }

  const addCard = (laneId: string) => {
    const title = prompt('Card title')
    if (!title) return
    setLanes(lanes.map(l =>
      l.id === laneId ? { ...l, cards: [...l.cards, { id: `card-${Date.now()}`, title }] } : l
    ))
  }

  const moveCard = (fromLane: number, fromCard: number, toLane: number) => {
    if (fromLane === toLane) return
    setLanes(prev => {
      const copy = prev.map(l => ({ ...l, cards: [...l.cards] }))
      const [card] = copy[fromLane].cards.splice(fromCard, 1)
      copy[toLane].cards.push(card)
      return copy
    })
  }

  const updateTitle = (laneId: string, title: string) => {
    setLanes(lanes.map(l => (l.id === laneId ? { ...l, title } : l)))
  }

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    laneIndex: number,
    cardIndex: number
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ laneIndex, cardIndex }))
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, laneIndex: number) => {
    e.preventDefault()
    try {
      const { laneIndex: fromLane, cardIndex } = JSON.parse(
        e.dataTransfer.getData('text/plain')
      )
      moveCard(fromLane, cardIndex, laneIndex)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="kanban-canvas">
      <header style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <h2>{boardTitle}</h2>
        <p>{boardDescription}</p>
      </header>
      <div className="kanban-board">
        {lanes.map((lane, i) => (
          <Lane
            key={lane.id}
            lane={lane}
            laneIndex={i}
            onAddCard={addCard}
            onUpdateTitle={updateTitle}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
        <div className="kanban-lane add-lane" onClick={addLane}>
          <button className="btn-primary">
            <span className="btn-plus" aria-hidden="true">+</span>
            Add Lane
          </button>
        </div>
      </div>
    </div>
  )
}

interface LaneProps {
  lane: Lane
  laneIndex: number
  onAddCard: (laneId: string) => void
  onUpdateTitle: (laneId: string, title: string) => void
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    laneIndex: number,
    cardIndex: number
  ) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, laneIndex: number) => void
}

function Lane({ lane, laneIndex, onAddCard, onUpdateTitle, onDragStart, onDrop }: LaneProps) {
  const [editing, setEditing] = useState(false)
  const [tempTitle, setTempTitle] = useState(lane.title)

  const save = () => {
    onUpdateTitle(lane.id, tempTitle)
    setEditing(false)
  }

  return (
    <div
      className="kanban-lane"
      onDragOver={e => e.preventDefault()}
      onDrop={e => onDrop(e, laneIndex)}
    >
      {editing ? (
        <div className="lane-title-edit">
          <input
            value={tempTitle}
            onChange={e => setTempTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
          />
          <button onClick={save} aria-label="Save" className="save-btn">
            ✓
          </button>
        </div>
      ) : (
        <h3 className="lane-title" onClick={() => setEditing(true)}>
          {lane.title}
        </h3>
      )}
      {lane.cards.map((card, i) => (
        <div
          key={card.id}
          className="kanban-card"
          draggable
          onDragStart={e => onDragStart(e, laneIndex, i)}
        >
          {card.title}
        </div>
      ))}
      <button className="btn-secondary" onClick={() => onAddCard(lane.id)}>
        Add Card
      </button>
    </div>
  )
}
