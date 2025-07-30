import FaintMindmapBackground from './FaintMindmapBackground'
import MindmapArm from './MindmapArm'
import { useAuth0 } from '@auth0/auth0-react'

export default function ProfilePage(): JSX.Element {
  const { user, isAuthenticated, isLoading } = useAuth0()

  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <p>Please log in to view your profile.</p>

  return (
    <section className="section relative overflow-hidden">
      <MindmapArm side="right" />
      <FaintMindmapBackground />
      <div className="form-card text-center profile-page">
        <h1 className="text-2xl font-semibold mb-4">User Profile</h1>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    </section>
  )
}
