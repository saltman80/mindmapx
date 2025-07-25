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

  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setComments(card.comments || [])
    }
  }, [card])

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
    onSave({ ...card, title, comments })
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
