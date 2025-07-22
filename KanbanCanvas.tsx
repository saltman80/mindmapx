import { useState } from 'react'

interface Card { id: string; title: string }
interface Lane { id: string; title: string; cards: Card[] }

export default function KanbanCanvas() {
  const [lanes, setLanes] = useState<Lane[]>([
    { id: 'todo', title: 'To Do', cards: [] },
    { id: 'doing', title: 'In Progress', cards: [] },
    { id: 'done', title: 'Done', cards: [] }
  ])
  const [newCardTitle, setNewCardTitle] = useState('')
  const [activeLane, setActiveLane] = useState('todo')

  const addCard = () => {
    const t = newCardTitle.trim()
    if (!t) return
    setLanes(prev =>
      prev.map(l =>
        l.id === activeLane
          ? { ...l, cards: [...l.cards, { id: Date.now().toString(), title: t }] }
          : l
      )
    )
    setNewCardTitle('')
  }

  return (
    <div className="kanban-canvas">
      <div className="card-form">
        <select value={activeLane} onChange={e => setActiveLane(e.target.value)}>
          {lanes.map(l => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
        <input
          value={newCardTitle}
          onChange={e => setNewCardTitle(e.target.value)}
          placeholder="Card title"
        />
        <button onClick={addCard}>+</button>
      </div>
      <div className="kanban-board">
        {lanes.map(lane => (
          <div key={lane.id} className="kanban-lane">
            <h3 className="lane-title">{lane.title}</h3>
            {lane.cards.map(c => (
              <div key={c.id} className="kanban-card">{c.title}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
