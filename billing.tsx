import { useState, useEffect } from 'react'

interface BillingInfo {
  lastInvoiceDate: string
  lastAmount: number
}

export default function BillingPage(): JSX.Element {
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelMsg, setCancelMsg] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetch('/api/billing', { credentials: 'include', signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load billing info')
        return res.json() as Promise<BillingInfo>
      })
      .then(data => setInfo(data))
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Unknown error')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const handleCancel = () => {
    setLoading(true)
    setError(null)
    setCancelMsg(null)
    fetch('/api/billing/cancel', { method: 'POST', credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to cancel subscription')
        return res.json()
      })
      .then(() => setCancelMsg('Subscription cancelled'))
      .catch(err => setError(err.message || 'Unknown error'))
      .finally(() => setLoading(false))
  }

  return (
    <div className="billing-page container mx-auto p-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-4">Billing Details</h1>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {cancelMsg && <div className="text-green-600 mb-4">{cancelMsg}</div>}
      {loading && <div>Loading...</div>}
      {info && (
        <div className="space-y-4">
          <p>
            Last Payment:{' '}
            <strong>{new Date(info.lastInvoiceDate).toLocaleDateString()}</strong>
          </p>
          <p>
            Amount Paid: <strong>${info.lastAmount.toFixed(2)}</strong>
          </p>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  )
}
