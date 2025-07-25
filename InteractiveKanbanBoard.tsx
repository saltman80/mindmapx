import { useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd'
import CardModal, { Card } from './CardModal'

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
  const [selected, setSelected] = useState<{ laneId: string; card: Card } | null>(null)

  const addLane = () => {
    const id = `lane-${Date.now()}`
    setLanes(prev => [...prev, { id, title: 'New Lane', cards: [] }])
  }

  const removeLane = (laneId: string) => {
    const lane = lanes.find(l => l.id === laneId)
    if (lane?.title === 'Done') {
      alert('Cannot rename or delete the Done column.')
      return
    }
    setLanes(prev => prev.filter(l => l.id !== laneId))
  }

  const addCard = (laneId: string) => {
    const newCard: Card = {
      id: `card-${Date.now()}`,
      title: '',
      comments: [],
      status: 'open',
      priority: 'low',
    }
    setLanes(prev =>
      prev.map(l => (l.id === laneId ? { ...l, cards: [...l.cards, newCard] } : l))
    )
  }

  const moveCard = (
    id: string,
    fromLaneId: string,
    toLaneId: string,
    destIndex: number
  ) => {
    setLanes(prev => {
      const copy = prev.map(l => ({ ...l, cards: [...l.cards] }))
      const fromLane = copy.find(l => l.id === fromLaneId)
      const toLane = copy.find(l => l.id === toLaneId)
      if (!fromLane || !toLane) return prev
      const cardIndex = fromLane.cards.findIndex(c => c.id === id)
      if (cardIndex === -1) return prev
      const [card] = fromLane.cards.splice(cardIndex, 1)
      const updatedCard =
        toLane.title === 'Done' ? { ...card, status: 'done' } : card
      toLane.cards.splice(destIndex, 0, updatedCard)
      return copy
    })
  }

  const moveLane = (id: string, from: number, to: number) => {
    setLanes(prev => {
      const copy = [...prev]
      const index = copy.findIndex(l => l.id === id)
      if (index === -1) return prev
      const [lane] = copy.splice(index, 1)
      copy.splice(to, 0, lane)
      return copy
    })
  }

  const updateTitle = (laneId: string, title: string) => {
    const lane = lanes.find(l => l.id === laneId)
    if (lane?.title === 'Done') {
      alert('Cannot rename or delete the Done column.')
      return
    }
    if (title === 'Done') {
      alert('Cannot create another Done column.')
      return
    }
    setLanes(lanes.map(l => (l.id === laneId ? { ...l, title } : l)))
  }

  const updateCard = (laneId: string, updatedCard: Card) => {
    setLanes(prev =>
      prev.map(l =>
        l.id === laneId
          ? {
              ...l,
              cards: l.cards.map(c => (c.id === updatedCard.id ? updatedCard : c)),
            }
          : l
      )
    )
  }

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result

    if (!destination) return

    if (type === 'CARD') {
      moveCard(draggableId, source.droppableId, destination.droppableId, destination.index)
    }

    if (type === 'COLUMN') {
      moveLane(draggableId, source.index, destination.index)
    }
  }

  return (
    <div className="kanban-canvas">
      <div className="kanban-header">
        <h1 className="kanban-title">{boardTitle}</h1>
        <p className="kanban-description">{boardDescription}</p>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {provided => (
            <div
              className="kanban-board"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {lanes.map((lane, i) => (
                <Draggable key={lane.id} draggableId={lane.id} index={i}>
                  {providedLane => (
                    <div
                      ref={providedLane.innerRef}
                      {...providedLane.draggableProps}
                      className="lane-wrapper"
                    >
                      <div {...providedLane.dragHandleProps} className="lane">
                        <Lane
                          lane={lane}
                          onAddCard={addCard}
                          onUpdateTitle={updateTitle}
                          onUpdateCard={updateCard}
                          onCardClick={(laneId, card) =>
                            setSelected({ laneId, card })
                          }
                          onRemoveLane={removeLane}
                        />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              <div className="lane add-lane" onClick={addLane}>
                <button className="add-lane-button">+ Add Lane</button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <CardModal
        card={selected?.card || null}
        onClose={() => setSelected(null)}
        onSave={card => {
          if (selected) updateCard(selected.laneId, card)
        }}
      />
    </div>
  )
}

interface LaneProps {
  lane: Lane
  onAddCard: (laneId: string) => void
  onUpdateTitle: (laneId: string, title: string) => void
  onUpdateCard: (laneId: string, card: Card) => void
  onCardClick: (laneId: string, card: Card) => void
  onRemoveLane: (laneId: string) => void
}

function Lane({ lane, onAddCard, onUpdateTitle, onUpdateCard, onCardClick, onRemoveLane }: LaneProps) {
  const [tempTitle, setTempTitle] = useState(lane.title)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [tempCardTitle, setTempCardTitle] = useState('')

  const save = () => {
    onUpdateTitle(lane.id, tempTitle)
  }

  const startEditCard = (card: Card) => {
    setEditingCardId(card.id)
    setTempCardTitle(card.title)
  }

  const saveCard = () => {
    if (editingCardId) {
      const existing = lane.cards.find(c => c.id === editingCardId)
      if (existing) {
        onUpdateCard(lane.id, { ...existing, title: tempCardTitle })
      }
    }
    setEditingCardId(null)
    setTempCardTitle('')
  }

  return (
    <Droppable droppableId={lane.id} type="CARD">
      {provided => (
        <div
          className={`lane ${lane.title.toLowerCase() === 'done' ? 'done' : ''}`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div className="lane-header">
            {lane.title.toLowerCase() === 'done' ? (
              <h3 className="lane-title">{lane.title}</h3>
            ) : (
              <>
                <input
                  className="lane-title-input"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  onBlur={save}
                  onKeyDown={e => e.key === 'Enter' && save()}
                />
                <button
                  className="lane-delete"
                  onClick={() => onRemoveLane(lane.id)}
                  aria-label="Delete"
                >
                  ✖
                </button>
              </>
            )}
          </div>
          {lane.cards.map((card, i) => (
            <Draggable key={card.id} draggableId={card.id} index={i}>
              {providedCard => (
                <div
                  ref={providedCard.innerRef}
                  {...providedCard.draggableProps}
                  {...providedCard.dragHandleProps}
                  className="card"
                  onClick={() => onCardClick(lane.id, card)}
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
                  {card.dueDate && (
                    <div className="card-meta">Due: {card.dueDate}</div>
                  )}
                  {card.todoId && (
                    <div className="todo-link">
                      🔗 <a href={`/todo/${card.todoListId}`}>From Todo List</a>
                      {card.mindmapId && (
                        <> + <a href={`/maps/${card.mindmapId}`}>Mindmap</a></>
                      )}
                    </div>
                  )}
                </>
              )}
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
          <button className="btn-secondary" onClick={() => onAddCard(lane.id)}>
            + Add Card
          </button>
        </div>
      )}
    </Droppable>
  )
}
