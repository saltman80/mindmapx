import { useState, useEffect } from 'react'
import Modal from './modal'
import { v4 as uuid } from 'uuid'

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
}

interface Props {
  card: Card | null
  onClose: () => void
  onSave: (card: Card) => void
  currentUser?: { name: string }
}

export default function CardModal({ card, onClose, onSave, currentUser }: Props) {
  const [title, setTitle] = useState(card?.title || '')
  const [description, setDescription] = useState(card?.description || '')
  const [comments, setComments] = useState<Comment[]>(card?.comments || [])
  const [newComment, setNewComment] = useState('')
  const [dueDate, setDueDate] = useState(card?.dueDate || '')
  const [priority, setPriority] = useState<Card['priority']>(card?.priority || 'low')
  const [status, setStatus] = useState<Card['status']>(card?.status || 'open')
  const [assignee, setAssignee] = useState(card?.assignee || '')
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description || '')
      setComments(card.comments || [])
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

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const comment: Comment = {
      id: uuid(),
      text: newComment,
      createdAt: new Date().toISOString(),
      author: currentUser?.name || 'Anon'
    }
    setComments([...comments, comment])
    setNewComment('')
  }

  const save = () => {
    if (!card) return
    onSave({
      ...card,
      title,
      description,
      comments,
      dueDate,
      priority,
      status,
      assignee,
    })
    onClose()
  }

  return (
    <Modal isOpen={!!card} onClose={onClose} ariaLabel="Edit card">
      {card && (
        <div className="card-modal">
          <h2 className="mb-2 text-lg font-semibold">Edit Card</h2>

          <section className="card-section">
            <h3 className="section-title">Card Details</h3>
            <label>
              Title
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input"
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="textarea"
              />
            </label>

            <div className="card-meta-grid">
              <div>
                <label>Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as Card['status'])}
                  className="select"
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
                  className="input"
                />
              </div>

              <div>
                <label>Priority</label>
                <select
                  value={priority}
                  onChange={e =>
                    setPriority(e.target.value as Card['priority'])
                  }
                  className="select"
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
                  className="select"
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
            <section className="card-section">
              <h3 className="section-title">Linked Elements</h3>
              <div className="card-links">
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

          <section className="card-section">
            <h3 className="section-title">Comments</h3>
            <div>
              {comments.map(c => (
                <div key={c.id} className="comment">
                  <strong>{c.author}</strong>
                  <p>{c.text}</p>
                  <span>{new Date(c.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <label>
              Comment
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="textarea"
              />
            </label>

            <div className="card-actions">
              <button onClick={handleAddComment} className="button orange">
                Post
              </button>
              <button onClick={save} className="button blue">
                Save
              </button>
            </div>
          </section>
        </div>
      )}
    </Modal>
  )
}
