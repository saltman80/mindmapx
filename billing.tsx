import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import FaintMindmapBackground from './FaintMindmapBackground'

interface BillingInfo {
  lastInvoiceDate: string
  lastAmount: number
}

interface Invoice {
  id: string
  amount: number
  date: string
  url: string
}

export default function BillingPage(): JSX.Element {
  const [info, setInfo] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelMsg, setCancelMsg] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/billing', {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to load billing info')
        const billData: BillingInfo = await res.json()
        setInfo(billData)
        const invRes = await fetch('/api/billing/invoices?limit=12', {
          credentials: 'include',
          signal: controller.signal,
        })
        if (!invRes.ok) throw new Error('Failed to load invoices')
        const invData: Invoice[] = await invRes.json()
        setInvoices(Array.isArray(invData) ? invData : [])
      } catch (err: any) {
        if (err.name !== 'AbortError') setError(err.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
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
    <section className="section relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="form-card">
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
          <div>
            <Link to="/checkout" className="text-blue-600 underline">
              Update Payment Method
            </Link>
          </div>
          {invoices.length > 0 && (
            <div>
              <h2 className="font-semibold mt-4">Recent Invoices</h2>
              <ul className="list-disc pl-4 space-y-1">
                {invoices.map(inv => (
                  <li key={inv.id}>
                    <a href={inv.url} className="text-blue-600 underline" download>
                      {new Date(inv.date).toLocaleDateString()} - ${inv.amount.toFixed(2)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Cancel Subscription
          </button>
          <div className="mt-lg text-center">
            <Link to="/purchase" className="btn">Purchase</Link>
          </div>
        </div>
      )}
      </div>
    </section>
  )
}
