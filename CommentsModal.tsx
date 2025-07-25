import React, { useState, useEffect, useRef } from 'react'
import Modal from './modal'
import type { Card, Comment } from './CardModal'

interface Props {
  card: Card | null
  onClose: () => void
  onAdd: (comment: Comment) => void
  currentUser?: { name: string }
}

export default function CommentsModal({ card, onClose, onAdd, currentUser }: Props) {
  const [text, setText] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const feedRef = useRef<HTMLDivElement>(null)

  const submitComment = async () => {
    if (!card || !text.trim()) return
    const body = { todoId: card.id, comment: text.trim() }
    const res = await fetch('/.netlify/functions/todo-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const newComment = {
        comment: body.comment,
        author: 'You',
        created_at: new Date().toISOString(),
      } as any
      setComments(prev => [...prev, newComment])
      onAdd(newComment)
      setText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitComment()
    }
  }

  useEffect(() => {
    if (!card) return
    fetch(`/.netlify/functions/todo-comments?todoId=${card.id}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(setComments)
  }, [card?.id])

  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [comments])

  if (!card) return null

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
          {comments.map((c, i) => {
            const isMine = c.author === currentUser?.name
            const name = isMine ? 'Me' : c.author || 'Anon'
            return (
              <div key={i} className={`comment-bubble ${isMine ? 'me' : 'other'} fade-item`}>
                <div className="comment-meta">
                  <span className="comment-author">{name}</span>
                  <span className="comment-time">{new Date((c as any).created_at || c.createdAt).toLocaleString()}</span>
                </div>
                <div className="comment-body">{highlightMentions((c as any).comment || c.text)}</div>
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
          <button className="send-button" onClick={submitComment} disabled={!text.trim()}>Send</button>
        </div>
      </div>
    </Modal>
  )
}
