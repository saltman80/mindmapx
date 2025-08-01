import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FaintMindmapBackground from '../FaintMindmapBackground'
import { authFetch } from '../authFetch'
import { useUser } from './lib/UserContext'

export default function PurchasePage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useUser()

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!user) {
        navigate('/purchase-register?next=/purchase')
        return
      }

      const res = await authFetch('/.netlify/functions/createCheckoutSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.url) {
        window.location.href = data.url
      } else {
        setError(data?.message || 'Failed to start checkout')
      }
    } catch {
      setError('Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section relative overflow-x-visible">
      <FaintMindmapBackground />
      <div className="container text-center">
        <h1 className="mb-md">Upgrade Required</h1>
        <p className="mb-md">
          To continue using MindMapX you need to purchase a monthly subscription.
        </p>
        {user?.email && <p className="mb-md">Signed in as {user.email}</p>}
        <p className="total-charge">$7.95 per month</p>
        <form onSubmit={handlePurchase} className="purchase-form mb-lg">
          {error && <p className="mb-md text-error">{error}</p>}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Redirecting…' : 'Purchase Monthly Access'}
          </button>
        </form>
        <div className="features-grid mb-md">
          <div>Mindmaps</div>
          <div className="feature-limit">10</div>
          <div>Todo Lists</div>
          <div className="feature-limit">100</div>
          <div>Kanban Boards</div>
          <div className="feature-limit">10</div>
          <div>AI Automations</div>
          <div className="feature-limit">25 per month</div>
        </div>
        <p className="mb-xs">+ Coming soon team members</p>
        <p className="text-muted">Upgrades available in app</p>
      </div>
    </section>
  )
}
