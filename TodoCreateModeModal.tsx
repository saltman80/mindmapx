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
        <div className="flex flex-col">
          <div className="flex flex-col space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
            />
          </div>
          <div className="flex flex-col space-y-1 mt-4">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full p-2 border rounded resize-none h-24"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-6 space-x-3">
          <button
            className="bg-orange-500 text-white px-4 py-2 rounded flex items-center"
            onClick={() => onSelect('quick', title, description)}
          >
            📝 Quick Create
          </button>
          <button
            className="bg-gradient-to-r from-purple-500 to-green-400 text-white px-4 py-2 rounded flex items-center"
            onClick={() => onSelect('ai', title, description)}
            disabled={disableAI}
          >
            ✨ Create with AI
          </button>
          <button
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}
