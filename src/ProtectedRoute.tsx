import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Status {
  subscription_status: string
  trial_start_date: string | null
  paid_thru_date: string | null
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const check = async () => {
      const hasSession = /(?:^|;\s*)(session|token)=/.test(document.cookie)
      if (!hasSession) {
        navigate('/login')
        setLoading(false)
        return
      }
      try {
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
  }, [navigate])

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
