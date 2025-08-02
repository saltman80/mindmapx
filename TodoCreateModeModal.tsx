import { useState, useEffect } from 'react'
import Modal from './modal'

interface Props {
  isOpen: boolean
  nodeTitle: string
  nodeDescription: string
  onSelect: (option: 'quick' | 'ai', title: string, description: string) => void
  onClose: () => void
}

export default function TodoCreateModeModal({ isOpen, nodeTitle, nodeDescription, onSelect, onClose }: Props) {
  const [title, setTitle] = useState(nodeTitle)
  const [description, setDescription] = useState(nodeDescription)

  useEffect(() => {
    if (isOpen) {
      setTitle(nodeTitle)
      setDescription(nodeDescription)
    }
  }, [isOpen, nodeTitle, nodeDescription])

  const disableAI = !title || title.trim() === ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Create Todo List">
      <div className="modal-container card-modal fancy-modal" style={{ minWidth: '300px' }}>
        <h2 className="mb-4 text-lg font-semibold">Create Todo List</h2>
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-sm mb-1">Title</span>
            <input
              type="text"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm mb-1">Description</span>
            <textarea
              className="textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2.5">
          <button
            className="btn-primary"
            onClick={() => onSelect('quick', title, description)}
          >
            📝 Quick Create
          </button>
          <button
            className="btn-ai"
            onClick={() => onSelect('ai', title, description)}
            disabled={disableAI}
          >
            ✨ Create with AI
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
