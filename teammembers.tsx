import { useEffect, useState } from 'react'

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
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Team Members</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={addMember} className="mb-4 flex flex-col gap-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          className="border px-2 py-1"
          required
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="border px-2 py-1"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded self-start">
          Add
        </button>
      </form>
      <ul className="list-disc pl-5">
        {members.map(m => (
          <li key={m.id}>{m.name ? `${m.name} <${m.email}>` : m.email}</li>
        ))}
      </ul>
    </div>
  )
}
