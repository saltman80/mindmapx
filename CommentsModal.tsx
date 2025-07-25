import { useState } from 'react'
import Modal from './modal'
import { v4 as uuid } from 'uuid'
import type { Card, Comment } from './CardModal'

interface Props {
  card: Card | null
  onClose: () => void
  onAdd: (comment: Comment) => void
  currentUser?: { name: string }
}

export default function CommentsModal({ card, onClose, onAdd, currentUser }: Props) {
  const [text, setText] = useState('')

  if (!card) return null

  const add = () => {
    if (!text.trim()) return
    const comment: Comment = {
      id: uuid(),
      text,
      createdAt: new Date().toISOString(),
      author: currentUser?.name || 'Anon',
    }
    onAdd(comment)
    setText('')
  }

  return (
    <Modal isOpen={!!card} onClose={onClose} ariaLabel={`Comments for ${card.title}`}>
      <div className="comment-modal">
        <h2 className="mb-2 text-lg font-semibold">Comments for "{card.title}"</h2>
        <div className="comment-list">
          {(card.comments || []).map((c, idx) => {
            const isMine = c.author === currentUser?.name
            const name = isMine ? 'Me' : c.author || 'Anon'
            return (
              <div key={c.id} className="comment">
                <div className="text-sm font-semibold">{name}</div>
                <div className="text-sm">{c.text}</div>
                <div className="text-xs text-gray-500">
                  {new Date(c.createdAt).toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            className="textarea-styled w-full"
          />
          <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={add} className="btn-primary" disabled={!text.trim()}>
              Post Comment
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
