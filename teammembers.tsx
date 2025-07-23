import { useEffect, useState } from 'react'
import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'

interface Member {
  id: string
  email: string
  name?: string
}

export default function TeamMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function removeMember(id: string) {
    setMembers(list => list.filter(m => m.id !== id))
  }

  async function updateMember(id: string) {
    console.log('update', id)
  }

  async function loadMembers() {
    try {
      const res = await fetch('/.netlify/functions/team-members')
      if (!res.ok) throw new Error('Failed to load members')
      const data = await res.json()
      setMembers(data.members)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/.netlify/functions/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      if (!res.ok) throw new Error('Failed to add member')
      setName('')
      setEmail('')
      loadMembers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  return (
    <section className="section relative overflow-hidden">
      <MindmapArm side="right" />
      <FaintMindmapBackground />
      <div className="form-card text-center">
        <h1 className="mb-4">Team Members</h1>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <form onSubmit={addMember} className="mb-4 space-y-4">
          <div className="form-field text-left">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-field text-left">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <button type="submit" className="btn w-full">
            Add
          </button>
        </form>
        <div className="four-col-grid mt-6">
          {members.map(m => (
            <div className="tile" key={m.id}>
              <div className="tile-header">
                <h2>{m.name || m.email}</h2>
                <div className="tile-actions">
                  <button onClick={() => updateMember(m.id)}>Update</button>
                  <button onClick={() => removeMember(m.id)} className="tile-link">Delete</button>
                </div>
              </div>
              {m.name && <p>{m.email}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
