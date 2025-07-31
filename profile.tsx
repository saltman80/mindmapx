import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'
import { useState, useEffect } from 'react'

export default function ProfilePage(): JSX.Element {
  const [user, setUser] = useState<{ name?: string; email?: string; picture?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/.netlify/functions/me', { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setUser(data?.user || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>
  if (!user) return <p>Please log in to view your profile.</p>

  return (
    <section className="section profile-section relative overflow-hidden">
      <MindmapArm side="right" />
      <FaintMindmapBackground />
      <div className="form-card text-center profile-page">
        {user?.picture && (
          <img
            src={user.picture}
            alt={`${user.name}'s avatar`}
            className="profile-avatar"
          />
        )}
        <h1 className="text-2xl font-semibold mb-2">{user?.name}</h1>
        {user?.email && (
          <p className="text-sm text-muted mb-4">{user.email}</p>
        )}
        <div className="profile-details">
          {user?.nickname && (
            <p>
              <strong>Nickname:</strong> {user.nickname}
            </p>
          )}
          {user?.given_name && (
            <p>
              <strong>Given Name:</strong> {user.given_name}
            </p>
          )}
          {user?.family_name && (
            <p>
              <strong>Family Name:</strong> {user.family_name}
            </p>
          )}
          {user?.email_verified !== undefined && (
            <p>
              <strong>Email Verified:</strong> {user.email_verified ? 'Yes' : 'No'}
            </p>
          )}
          {user?.updated_at && (
            <p>
              <strong>Last Updated:</strong>{' '}
              {new Date(user.updated_at).toLocaleDateString()}
            </p>
          )}
          {user?.sub && (
            <p>
              <strong>User ID:</strong> {user.sub}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
