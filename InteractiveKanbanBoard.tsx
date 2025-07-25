import { useState, useRef, useEffect } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd'
import CardModal, { Card } from './CardModal'
import CommentsModal from './CommentsModal'

const colorPalette = [
  '#FFA726', '#FFB74D', '#FFCA28', '#FFD54F', '#FFEE58', '#FFF176',
  '#D4E157', '#AED581', '#81C784', '#66BB6A', '#26A69A', '#4DD0E1',
  '#29B6F6', '#42A5F5', '#5C6BC0', '#7E57C2', '#8E24AA', '#9C27B0',
  '#AB47BC', '#EC407A', '#FF7043', '#8D6E63', '#78909C', '#90A4AE',
  '#A1887F', '#B0BEC5', '#C5CAE9', '#B39DDB', '#CFD8DC', '#E1BEE7'
]
const columnColor = (i: number) => colorPalette[i % colorPalette.length]

interface Lane {
  id: string
  title: string
  cards: Card[]
}

interface Props {
  title?: string
  description?: string
}

const isOverdue = (date: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(date) < today
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
  const [editing, setEditing] = useState<{ laneId: string; card: Card } | null>(null)
  const [commenting, setCommenting] = useState<{ laneId: string; card: Card } | null>(null)
  const autoScrollRightRef = useRef<HTMLDivElement | null>(null)

  const sortedLanes = [
    ...lanes.filter(l => l.title !== 'Done'),
    lanes.find(l => l.title === 'Done'),
  ].filter(Boolean) as Lane[]

  const addLane = () => {
    const id = `lane-${Date.now()}`
    setLanes(prev => {
      const done = prev.find(l => l.title === 'Done')
      const others = prev.filter(l => l.title !== 'Done')
      return done ? [...others, { id, title: 'New Lane', cards: [] }, done] : [...prev, { id, title: 'New Lane', cards: [] }]
    })
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
      const withoutDone = copy.filter(l => l.title !== 'Done')
      const done = copy.find(l => l.title === 'Done')
      return done ? [...withoutDone, done] : withoutDone
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

  useEffect(() => {
    if (autoScrollRightRef.current) {
      autoScrollRightRef.current.scrollLeft = autoScrollRightRef.current.scrollWidth;
    }
  }, [lanes.length]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result

    if (!destination) return

    const draggedLane = lanes.find(l => l.id === draggableId)
    if (type === 'COLUMN' && draggedLane?.title === 'Done') return

    if (type === 'CARD') {
      moveCard(draggableId, source.droppableId, destination.droppableId, destination.index)
    }

    if (type === 'COLUMN') {
      moveLane(draggableId, source.index, destination.index)
    }
  }

  return (
    <div className="kanban-canvas">
      <header className="kanban-header">
        <div className="header-left">
          <div className="kanban-icon" aria-hidden="true">🗂️</div>
          <div>
            <h1 className="kanban-title">{boardTitle}</h1>
            <p className="kanban-description">{boardDescription}</p>
          </div>
        </div>
        <div className="header-right">
          <button className="settings-button" aria-label="Settings">⋯</button>
        </div>
      </header>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="COLUMN" direction="horizontal">
          {provided => (
            <div className="scroll-container" ref={autoScrollRightRef}>
              <div
                className="kanban-board"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {sortedLanes.map((lane, i) => (
                  <Draggable key={lane.id} draggableId={lane.id} index={i} isDragDisabled={lane.title === 'Done'}>
                    {providedLane => (
                      <div
                        ref={providedLane.innerRef}
                        {...providedLane.draggableProps}
                        className="lane-wrapper"
                      >
                        <div {...providedLane.dragHandleProps} className="lane">
                          <Lane
                            lane={lane}
                            index={i}
                            onAddCard={addCard}
                            onUpdateTitle={updateTitle}
                            onUpdateCard={updateCard}
                            onEditCard={(laneId, card) =>
                              setEditing({ laneId, card })
                            }
                            onShowComments={(laneId, card) =>
                              setCommenting({ laneId, card })
                            }
                            onRemoveLane={removeLane}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <div className="lane kanban-lane add-lane" onClick={addLane}>
                  <button className="add-lane-button">+ Add Lane</button>
                </div>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <CardModal
        card={editing?.card || null}
        onClose={() => setEditing(null)}
        onSave={card => {
          if (editing) updateCard(editing.laneId, card)
        }}
      />
      <CommentsModal
        card={commenting?.card || null}
        onClose={() => setCommenting(null)}
        onAdd={comment => {
          if (commenting) {
            const updated = {
              ...commenting.card,
              comments: [...(commenting.card.comments || []), comment],
            }
            updateCard(commenting.laneId, updated)
            setCommenting({ laneId: commenting.laneId, card: updated })
          }
        }}
      />
    </div>
  )
}

interface LaneProps {
  lane: Lane
  index: number
  onAddCard: (laneId: string) => void
  onUpdateTitle: (laneId: string, title: string) => void
  onUpdateCard: (laneId: string, card: Card) => void
  onEditCard: (laneId: string, card: Card) => void
  onShowComments: (laneId: string, card: Card) => void
  onRemoveLane: (laneId: string) => void
}

function Lane({
  lane,
  index,
  onAddCard,
  onUpdateTitle,
  onUpdateCard,
  onEditCard,
  onShowComments,
  onRemoveLane,
}: LaneProps) {
  const [tempTitle, setTempTitle] = useState(lane.title)

  const save = () => {
    onUpdateTitle(lane.id, tempTitle)
  }

  return (
    <Droppable droppableId={lane.id} type="CARD">
      {provided => (
        <div
          className={`lane kanban-lane ${
            lane.title.toLowerCase() === 'done' ? 'done' : ''
          }`}
          ref={provided.innerRef}
          {...provided.droppableProps}
        >
          <div
            className={`lane-header-bar ${
              lane.title === 'Done'
                ? 'done-bar'
                : lane.title === 'In-Progress'
                ? 'in-progress-bar'
                : 'other-bar'
            }`}
          />
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
                  className={`kanban-card ${
                    card.dueDate && isOverdue(card.dueDate) ? 'past-due' : ''
                  }`}
                >
                  <div className="kanban-title">{card.title || 'New Card'}</div>
                  <div className="kanban-meta">
                    {card.priority && (
                      <span className={`priority-badge ${card.priority}`}>
                        ⚠️ {card.priority.charAt(0).toUpperCase() +
                        card.priority.slice(1)}
                      </span>
                    )}
                    {card.dueDate && (
                      <span
                        className={`due-date ${
                          isOverdue(card.dueDate) ? 'overdue' : ''
                        }`}
                      >
                        📅 {card.dueDate}
                      </span>
                    )}
                  </div>
                  <div className="kanban-actions">
                    <button
                      className="action-button"
                      title="Edit"
                      onClick={() => onEditCard(lane.id, card)}
                    >
                      ✏️
                    </button>
                    <button
                      className="action-button"
                      title="Comments"
                      onClick={() => onShowComments(lane.id, card)}
                    >
                      💬
                    </button>
                  </div>
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
