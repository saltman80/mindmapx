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
      <div className="modal-container max-w-xl p-6 mx-auto bg-white shadow-lg rounded">
        <h2 className="mb-4 text-lg font-semibold">Comments for "{card.title}"</h2>
        <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
          {(card.comments || []).map(c => (
            <div key={c.id} className="p-2 border rounded">
              <div className="text-sm font-semibold">{c.author}</div>
              <div className="text-sm">{c.text}</div>
              <div className="text-xs text-gray-500">
                {new Date(c.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="textarea-styled w-full mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={add} className="btn-post" disabled={!text.trim()}>
            Post Comment
          </button>
        </div>
      </div>
    </Modal>
  )
}
