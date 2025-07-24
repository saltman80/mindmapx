import { useState } from 'react'
import Modal from './modal'

export interface AddTodoButtonProps {
  onCreate: (todo: { title: string; description: string }) => void
}

export default function AddTodoButton({
  onCreate,
}: AddTodoButtonProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate({ title, description })
    setOpen(false)
    setTitle('')
    setDescription('')
  }

  return (
    <div className="add-todo-button-wrapper">
      <button className="btn-primary" onClick={() => setOpen(true)}>
        Create Todo
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} ariaLabel="Create todo">
        <form onSubmit={handleSubmit} className="todo-form">
          <h2>Create Todo</h2>
          <input
            type="text"
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Name"
            required
          />
          <textarea
            className="form-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            style={{ marginTop: '0.5rem' }}
          />
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
