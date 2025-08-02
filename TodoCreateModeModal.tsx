import Modal from './modal'

interface Props {
  isOpen: boolean
  nodeTitle: string
  nodeDescription: string
  onSelect: (option: 'quick' | 'ai') => void
  onClose: () => void
}

export default function TodoCreateModeModal({ isOpen, nodeTitle, nodeDescription, onSelect, onClose }: Props) {
  const disableAI = !nodeTitle || nodeTitle.trim() === ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} ariaLabel="Create Todo List">
      <div className="modal-container card-modal" style={{ minWidth: '300px' }}>
        <h2 className="mb-2 text-lg font-semibold">Create Todo List</h2>
        {nodeTitle && <p className="text-sm mb-1">{nodeTitle}</p>}
        {nodeDescription && (
          <p className="text-xs text-gray-500 mb-2">{nodeDescription}</p>
        )}
        <div className="flex flex-col gap-3">
          <button
            className="btn-primary"
            onClick={() => onSelect('quick')}
          >
            📝 Quick Create
          </button>
          <button
            className="btn-primary"
            onClick={() => onSelect('ai')}
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
