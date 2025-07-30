import { useState } from 'react'
import FaintMindmapBackground from '../FaintMindmapBackground'

export default function PurchasePage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Valid email required')
      return
    }
    setLoading(true)
    localStorage.setItem('emailForPurchase', email)
    try {
      const res = await fetch('/.netlify/functions/createCheckoutSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
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
        <form onSubmit={handlePurchase} className="purchase-form">
          <input
            type="email"
            required
            placeholder="Email"
            className="form-input mb-md"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {error && <p className="mb-md text-error">{error}</p>}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Processing...' : 'Purchase Now'}
          </button>
        </form>
      </div>
    </section>
  )
}
