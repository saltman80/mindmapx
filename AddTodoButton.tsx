import { useState } from 'react'
import Modal from './modal'

export default function AddTodoButton(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setOpen(false)
    setTitle('')
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
            placeholder="Title"
            required
          />
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn-cancel" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
