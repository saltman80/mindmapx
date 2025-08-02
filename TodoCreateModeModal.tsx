import { useState, useEffect } from 'react'
import Modal from './modal'

interface Props {
  isOpen: boolean
  nodeTitle: string
  nodeDescription: string
  onSelect: (option: 'quick' | 'ai', title: string, description: string) => Promise<void>
  onClose: () => void
}

export default function TodoCreateModeModal({ isOpen, nodeTitle, nodeDescription, onSelect, onClose }: Props) {
  const [title, setTitle] = useState(nodeTitle)
  const [description, setDescription] = useState(nodeDescription)
  const [loading, setLoading] = useState<null | 'quick' | 'ai'>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle(nodeTitle)
      setDescription(nodeDescription)
      setError(null)
      setLoading(null)
    }
  }, [isOpen, nodeTitle, nodeDescription])

  const disableAI = !title || title.trim() === ''

  const handleSelect = async (option: 'quick' | 'ai') => {
    setError(null)
    setLoading(option)
    try {
      await onSelect(option, title, description)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Create Todo List">
      <div className="modal-container card-modal" style={{ minWidth: '300px' }}>
        <h2 className="mb-sm">Create Todo List</h2>
        <div className="modal-section">
          <label>
            Title
            <input
              type="text"
              className="input-styled"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              disabled={loading !== null}
            />
          </label>
          <label>
            Description
            <textarea
              className="textarea-styled"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              disabled={loading !== null}
            />
          </label>
          {error && (
            <p className="text-error" style={{ fontSize: '0.875rem' }}>
              {error}
            </p>
          )}
        </div>
        <div className="card-actions">
          <button
            className="btn-save"
            onClick={() => handleSelect('quick')}
            disabled={loading !== null}
          >
            {loading === 'quick' ? 'Creating...' : '📝 Quick Create'}
          </button>
          <button
            className="btn-post"
            onClick={() => handleSelect('ai')}
            disabled={disableAI || loading !== null}
          >
            {loading === 'ai' ? 'Thinking...' : '✨ Create with AI'}
          </button>
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={loading !== null}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
