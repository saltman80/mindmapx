import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'
import { useAuth0 } from '@auth0/auth0-react'

export default function ProfilePage(): JSX.Element {
  const { user, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <p>Please log in to view your profile.</p>

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
