import { useState } from 'react'
import FaintMindmapBackground from './FaintMindmapBackground'

export default function TrialExpired(): JSX.Element {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/createCheckoutSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.url) {
        window.location.href = data.url as string
        return
      }
      setError(data?.message || 'Failed to start checkout')
    } catch {
      setError('Failed to start checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section text-center relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="form-card">
        <h1 className="text-2xl font-bold mb-4">Trial Expired</h1>
        <p className="mb-4">Your trial has ended. Purchase to continue using the app.</p>
        {error && <p className="text-error mb-2">{error}</p>}
        <button onClick={startCheckout} className="btn" disabled={loading}>
          {loading ? 'Processing...' : 'Purchase'}
        </button>
      </div>
    </section>
  )
}
