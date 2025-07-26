import { useState, useEffect } from 'react'
import Modal from './modal'
import type { TodoItem } from './TodoCanvas'

interface Props {
  todo: TodoItem | null
  onClose: () => void
  onSave: (todo: TodoItem) => void
}

export default function TodoModal({ todo, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (todo) {
      setTitle(todo.title)
      setDescription(todo.description || '')
    }
  }, [todo])

  if (!todo) return null

  const save = () => {
    onSave({ ...todo, title, description })
    onClose()
  }

  return (
    <Modal isOpen={!!todo} onClose={onClose} ariaLabel="Edit todo">
      <div className="modal-container card-modal">
        <h2 className="mb-2 text-lg font-semibold">Edit Todo</h2>
        <div className="modal-section">
          <label>
            Title
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-styled"
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="textarea-styled"
            />
          </label>
        </div>
        <div className="card-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={save} className="btn-save">Save</button>
        </div>
      </div>
    </Modal>
  )
}
