import { useState } from 'react'
import FaintMindmapBackground from '../FaintMindmapBackground'

export default function PurchasePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePurchase = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/createCheckoutSession', {
        method: 'POST'
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
        <h1 className="mb-md">Purchase MindXdo</h1>
        {error && <p className="mb-md text-error">{error}</p>}
        <button onClick={handlePurchase} className="btn" disabled={loading}>
          {loading ? 'Processing...' : 'Purchase Now'}
        </button>
      </div>
    </section>
  )
}
