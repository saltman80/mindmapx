import { ReactNode } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loginWithRedirect, isLoading } = useAuth0()
  if (isLoading) return null
  if (!isAuthenticated) {
    loginWithRedirect()
    return null
  }
  return <>{children}</>
}
