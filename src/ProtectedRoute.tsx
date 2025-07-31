import { ReactNode, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'

interface Status {
  subscription_status: string
  trial_start_date: string | null
  paid_thru_date: string | null
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loginWithRedirect, isLoading, getAccessTokenSilently, user } = useAuth0()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
      const check = async () => {
        if (!isAuthenticated) return
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
              scope: 'openid email'
            }
          })
          const res = await fetch('/.netlify/functions/user-status', {
            headers: {
              Authorization: `Bearer ${token}`,
              ...(user?.email ? { 'X-User-Email': user.email } : {})
            }
          })
        if (res.ok) {
          const json = await res.json()
          setStatus(json.data as Status)
        } else {
          setStatus(null)
        }
      } catch {
        setStatus(null)
      }
    }
    check()
  }, [isAuthenticated, getAccessTokenSilently])

  if (isLoading || !status) return null
  if (!isAuthenticated) {
    loginWithRedirect({
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      },
    })
    return null
  }
  const now = Date.now()
  if (
    (status.subscription_status === 'trialing' &&
      status.trial_start_date &&
      now < new Date(status.trial_start_date).getTime() + 3 * 24 * 60 * 60 * 1000) ||
    ((status.subscription_status === 'active' || status.subscription_status === 'canceled') &&
      status.paid_thru_date &&
      now < new Date(status.paid_thru_date).getTime())
  ) {
    return <>{children}</>
  }
  navigate('/trial-expired')
  return null
}
