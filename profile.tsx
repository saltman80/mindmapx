import { useState, useEffect } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'

interface Profile {
  name: string
  email: string
  address: string
}

export default function ProfilePage(): JSX.Element {
  const [profile, setProfile] = useState<Profile>({ name: '', email: '', address: '' })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch('/api/profile', { credentials: 'include', signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load profile')
        return res.json() as Promise<Profile>
      })
      .then(data => setProfile(data))
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Unknown error')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    fetch('/api/profile', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update profile')
        return res.json()
      })
      .then(() => setSuccess(true))
      .catch(err => setError(err.message || 'Unknown error'))
      .finally(() => setLoading(false))
  }

  return (
    <section className="section relative overflow-hidden">
      <MindmapArm side="right" />
      <FaintMindmapBackground />
      <div className="form-card text-center profile-page">
        <h1 className="text-2xl font-semibold mb-4">Update Profile</h1>
        <img
          src="./assets/profile-header.png"
          alt="Profile header"
          className="profile-image w-32 mx-auto mb-4"
        />
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {success && <div className="text-green-600 mb-4">Profile updated!</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-field">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            id="name"
            name="name"
            value={profile.name}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={profile.email}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="address" className="form-label">Address</label>
          <textarea
            id="address"
            name="address"
            value={profile.address}
            onChange={handleChange}
            rows={3}
            className="form-input"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        </form>
      </div>
    </section>
  )
}
