import { useState, useEffect, useMemo } from 'react'
import Modal from './modal'

export interface Comment {
  id: string
  text: string
  createdAt: string
  author: string
}

export interface Card {
  id: string
  title: string
  description?: string
  comments?: Comment[]
  dueDate?: string
  priority?: 'low' | 'medium' | 'high'
  status?: 'open' | 'done'
  assignee?: string
  todoId?: string
  todoListId?: string
  mindmapId?: string
  position?: number
}

interface Props {
  card: Card | null
  onClose: () => void
  onSave: (card: Card) => void
  onDelete: (card: Card) => void
  currentUser?: { name: string }
}

export default function CardModal({
  card,
  onClose,
  onSave,
  onDelete,
  currentUser,
}: Props) {
  const [title, setTitle] = useState(card?.title || '')
  const [description, setDescription] = useState(card?.description || '')
  const [dueDate, setDueDate] = useState(card?.dueDate || '')
  const [priority, setPriority] = useState<Card['priority']>(card?.priority || 'low')
  const [status, setStatus] = useState<Card['status']>(card?.status || 'open')
  const [assignee, setAssignee] = useState(card?.assignee || '')
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([])

  const isDirty = useMemo(() => {
    if (!card) return false
    return (
      title !== card.title ||
      description !== (card.description || '') ||
      dueDate !== (card.dueDate || '') ||
      priority !== (card.priority || 'low') ||
      status !== (card.status || 'open') ||
      assignee !== (card.assignee || '')
    )
  }, [card, title, description, dueDate, priority, status, assignee])

  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description || '')
      setDueDate(card.dueDate || '')
      setPriority(card.priority || 'low')
      setStatus(card.status || 'open')
      setAssignee(card.assignee || '')
    }
  }, [card])

  useEffect(() => {
    fetch('/.netlify/functions/team-members')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.members)) setTeamMembers(data.members)
      })
      .catch(() => {})
  }, [])



  const save = () => {
    if (!card) return
    onSave({
      ...card,
      title,
      description,
      dueDate,
      priority,
      status,
      assignee,
    })
    alert('Card saved successfully.')
    onClose()
  }

  const handleDelete = () => {
    if (!card) return
    if (window.confirm('Delete this card?')) {
      onDelete(card)
      onClose()
    }
  }

  return (
    <Modal isOpen={!!card} onClose={onClose} ariaLabel="Edit card">
        {card && (
          <div className="modal-container card-modal">
          <h2 className="mb-2 text-lg font-semibold">Edit Card</h2>

          <section className="modal-section">
            <h3 className="section-title">Card Details</h3>
            <label>
              Title
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-styled"
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="textarea-styled"
              />
            </label>

            <div className="card-meta-grid">
              <div>
                <label>Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Card['status'])}
                  className="input-styled"
                >
                  <option value="open">Open</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div>
                <label>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="input-styled"
                />
              </div>

              <div>
                <label>Priority</label>
                <select
                  value={priority}
                  onChange={e =>
                    setPriority(e.target.value as Card['priority'])
                  }
                  className="input-styled"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label>Assignee</label>
                <select
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                  className="input-styled"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {(card.todoId || card.mindmapId) && (
            <section className="modal-section">
              <h3 className="section-title">Linked Elements</h3>
              <div className="linked-section">
                {card.todoId && (
                  <span>
                    🔗 Linked ToDo:{' '}
                    <a href={`/todo/${card.todoListId}`}>View</a>
                  </span>
                )}
                {card.mindmapId && (
                  <span>
                    {' '}& <a href={`/maps/${card.mindmapId}`}>Mindmap</a>
                  </span>
                )}
              </div>
            </section>
          )}

          <div className="card-actions">
            <button className="btn-danger" onClick={handleDelete}>🗑️ Delete</button>
            <div style={{ flexGrow: 1 }} />
            <button onClick={onClose} className="btn-cancel">Cancel</button>
            <button onClick={save} className="btn-save" disabled={!isDirty}>
              Save
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
