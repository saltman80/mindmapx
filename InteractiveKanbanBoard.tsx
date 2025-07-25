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

interface Props {
  title?: string
  description?: string
}

export default function InteractiveKanbanBoard({
  title,
  description,
}: Props) {
  const [lanes, setLanes] = useState<Lane[]>([
    { id: 'lane-1', title: 'New', cards: [] },
    { id: 'lane-2', title: 'In-Progress', cards: [] },
    { id: 'lane-3', title: 'Reviewing', cards: [] },
    { id: 'lane-4', title: 'Done', cards: [] },
  ])
  const [boardTitle] = useState(title || 'Kanban Board')
  const [boardDescription] = useState(
    description || 'Organize tasks across lanes'
  )

  const addLane = () => {
    const id = `lane-${Date.now()}`
    setLanes([...lanes, { id, title: 'New Lane', cards: [] }])
  }

  const addCard = (laneId: string) => {
    const newCard = { id: `card-${Date.now()}`, title: '' }
    setLanes(lanes.map(l =>
      l.id === laneId ? { ...l, cards: [...l.cards, newCard] } : l
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

  const updateCard = (laneId: string, cardId: string, title: string) => {
    setLanes(prev =>
      prev.map(l =>
        l.id === laneId
          ? {
              ...l,
              cards: l.cards.map(c => (c.id === cardId ? { ...c, title } : c)),
            }
          : l
      )
    )
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
      <div className="kanban-lanes">
        {lanes.map((lane, i) => (
          <Lane
            key={lane.id}
            lane={lane}
            laneIndex={i}
            onAddCard={addCard}
            onUpdateTitle={updateTitle}
            onUpdateCard={updateCard}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
        <div className="lane add-lane" onClick={addLane}>
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
  onUpdateCard: (laneId: string, cardId: string, title: string) => void
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    laneIndex: number,
    cardIndex: number
  ) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>, laneIndex: number) => void
}

function Lane({ lane, laneIndex, onAddCard, onUpdateTitle, onUpdateCard, onDragStart, onDrop }: LaneProps) {
  const [editing, setEditing] = useState(false)
  const [tempTitle, setTempTitle] = useState(lane.title)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [tempCardTitle, setTempCardTitle] = useState('')

  const save = () => {
    onUpdateTitle(lane.id, tempTitle)
    setEditing(false)
  }

  const startEditCard = (card: Card) => {
    setEditingCardId(card.id)
    setTempCardTitle(card.title)
  }

  const saveCard = () => {
    if (editingCardId) {
      onUpdateCard(lane.id, editingCardId, tempCardTitle)
    }
    setEditingCardId(null)
    setTempCardTitle('')
  }

  return (
    <div
      className="lane"
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
          className="card"
          draggable
          onDragStart={e => onDragStart(e, laneIndex, i)}
        >
          {editingCardId === card.id ? (
            <div className="card-edit">
              <input
                value={tempCardTitle}
                onChange={e => setTempCardTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveCard()}
              />
              <button onClick={saveCard} aria-label="Save" className="save-btn">
                ✓
              </button>
            </div>
          ) : (
            <>
              <div className="card-header">
                <span
                  className="edit-icon"
                  onClick={() => startEditCard(card)}
                >
                  ✎
                </span>
              </div>
              <p>{card.title || 'New Card'}</p>
            </>
          )}
        </div>
      ))}
      <button className="btn-secondary" onClick={() => onAddCard(lane.id)}>
        Add Card
      </button>
    </div>
  )
}
