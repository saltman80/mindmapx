import { ReactNode, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser } from './lib/UserContext'
import { isAdmin } from './lib/isAdmin'

interface Status {
  subscription_status: string
  trial_start_date: string | null
  paid_thru_date: string | null
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setUser } = useUser()
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let hasNavigated = false
    const navigateLogin = () => {
      if (!hasNavigated && location.pathname !== '/login') {
        hasNavigated = true
        navigate('/login')
      }
    }

    const check = async () => {
      try {
        const meRes = await fetch('/.netlify/functions/me', {
          credentials: 'include'
        })
        if (!meRes.ok) {
          navigateLogin()
          return
        }
        const meData = await meRes.json().catch(() => null)
        const user = meData?.user || null
        setUser(user)
        if (!user) {
          navigateLogin()
          return
        }

        if (isAdmin(user)) {
          setStatus({
            subscription_status: 'active',
            trial_start_date: null,
            paid_thru_date: null
          })
          return
        }

        const res = await fetch('/.netlify/functions/user-status', {
          credentials: 'include'
        })
        if (!res.ok) {
          navigateLogin()
          return
        }
        const json = await res.json()
        setStatus(json.data as Status)
      } catch {
        navigateLogin()
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [])

  if (isAdmin(user)) {
    return <>{children}</>
  }

  if (loading || !status) return null

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
  if (location.pathname !== '/trial-expired') {
    navigate('/trial-expired')
  }
  return null
}
