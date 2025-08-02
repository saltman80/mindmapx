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
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full" style={{ minWidth: '300px' }}>
        <h2 className="mb-4 text-lg font-semibold">Create Todo List</h2>
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title"
              disabled={loading !== null}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded shadow-sm resize-none h-24"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              disabled={loading !== null}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            onClick={() => handleSelect('quick')}
            disabled={loading !== null}
          >
            {loading === 'quick' ? 'Creating...' : '📝 Quick Create'}
          </button>
            <button
              className="bg-gradient-to-r from-purple-500 to-green-400 text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
              onClick={() => handleSelect('ai')}
              disabled={disableAI || loading !== null}
            >
              {loading === 'ai' ? 'Thinking...' : '✨ Create with AI'}
            </button>
          <button
            className="text-gray-600 hover:text-gray-900 px-4 py-2"
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
