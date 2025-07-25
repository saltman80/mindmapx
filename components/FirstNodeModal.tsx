import React, { useState } from 'react'

const FirstNodeModal = ({ onCreate }: { onCreate: (label: string) => void }) => {
  const [label, setLabel] = useState('')
  return (
    <div className="modal-overlay">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create Your First Node</h2>
        <input
          type="text"
          className="form-input"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Node title"
          required
        />
        <div style={{ marginTop: '1rem' }}>
          <button className="btn-primary" onClick={() => onCreate(label)}>
            Create Node
          </button>
        </div>
      </div>
    </div>
  )
}

export default FirstNodeModal
