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
      <div className="card-modal">
        <h2>Edit Card</h2>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border p-2 mb-4"
        />
        <label className="block mb-1">Due Date</label>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="w-full border p-2 mb-4"
        />
        <label className="block mb-1">Priority</label>
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Card['priority'])}
          className="w-full border p-2 mb-4"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <label className="block mb-1">Status</label>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as Card['status'])}
          className="w-full border p-2 mb-4"
        >
          <option value="open">Open</option>
          <option value="done">Done</option>
        </select>
        <label className="block mb-1">Assignee</label>
        <select
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
          className="w-full border p-2 mb-4"
        >
          <option value="">Unassigned</option>
          {teamMembers.map(m => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <div className="mb-4">
          {comments.map(c => (
            <div key={c.id} className="comment">
              <strong>{c.author}</strong>
              <p>{c.text}</p>
              <span>{new Date(c.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <textarea
          className="w-full border p-2 mb-2"
          placeholder="Add a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <button onClick={handleAddComment} className="btn-secondary">Post</button>
          <button onClick={save} className="btn-primary">Save</button>
        </div>
      </div>
    </Modal>
  )
}
