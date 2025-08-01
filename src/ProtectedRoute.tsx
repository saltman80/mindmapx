import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from './lib/UserContext'

interface Status {
  subscription_status: string
  trial_start_date: string | null
  paid_thru_date: string | null
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { setUser } = useUser()
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const meRes = await fetch('/.netlify/functions/me', {
          credentials: 'include'
        })
        if (!meRes.ok) {
          navigate('/login')
          return
        }
        const meData = await meRes.json().catch(() => null)
        setUser(meData?.user || null)

        const res = await fetch('/.netlify/functions/user-status', {
          credentials: 'include'
        })
        if (!res.ok) {
          navigate('/login')
          return
        }
        const json = await res.json()
        setStatus(json.data as Status)
      } catch {
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [navigate, setUser])

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
  navigate('/trial-expired')
  return null
}
