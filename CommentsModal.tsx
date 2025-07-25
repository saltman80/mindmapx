import React, { useState, useEffect, useRef } from 'react'
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
  const feedRef = useRef<HTMLDivElement>(null)

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      add()
    }
  }

  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [card?.comments])

  const highlightMentions = (text: string) => {
    return text.split(/(\@[\w-]+)/g).map((part, idx) => {
      if (/^@/.test(part)) {
        return (
          <span key={idx} className="mention">
            {part}
          </span>
        )
      }
      return <span key={idx}>{part}</span>
    })
  }

  return (
    <Modal isOpen={!!card} onClose={onClose} ariaLabel={`Comments for ${card.title}`}>
      <div className="comment-modal">
        <h2 className="mb-2 text-lg font-semibold">Comments for "{card.title}"</h2>
        <div className="comment-feed" ref={feedRef}>
          {(card.comments || []).map(c => {
            const isMine = c.author === currentUser?.name
            const name = isMine ? 'Me' : c.author || 'Anon'
            return (
              <div key={c.id} className={`comment-bubble ${isMine ? 'me' : 'other'} fade-item`}>
                <div className="comment-meta">
                  <span>{name}</span>
                  <span className="timestamp">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <div className="comment-text">{highlightMentions(c.text)}</div>
              </div>
            )
          })}
        </div>
        <div className="comment-input-bar">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a comment..."
            onKeyDown={handleKeyDown}
          />
          <button className="send-button" onClick={add} disabled={!text.trim()}>Send</button>
        </div>
      </div>
    </Modal>
  )
}
