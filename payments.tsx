import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import AdminNav from './src/AdminNav'
import { useUser } from './src/lib/UserContext'
import { isAdmin } from './src/lib/isAdmin'

interface Payment {
  id: string
  userId: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

const paymentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  amount: z.union([z.string(), z.number()]).transform(val => Number(val)),
  currency: z.string(),
  status: z.string(),
  created_at: z.string(),
})

const paymentsResponseSchema = z.object({
  payments: z.array(paymentSchema),
  hasNext: z.boolean(),
})

async function fetchPayments({
  page,
  limit,
  signal,
}: {
  page: number
  limit: number
  signal?: AbortSignal
}): Promise<{ payments: Payment[]; hasNext: boolean }> {
  const params = new URLSearchParams()
  params.append('page', page.toString())
  params.append('limit', limit.toString())
  const response = await fetch(`/api/payments?${params.toString()}`, {
    credentials: 'include',
    signal,
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch payments: ${response.statusText}`)
  }
  const json = await response.json()
  const parsed = paymentsResponseSchema.parse(json)
  const payments = parsed.payments.map(p => ({
    id: p.id,
    userId: p.user_id,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    createdAt: p.created_at,
  }))
  return { payments, hasNext: parsed.hasNext }
}

const PaymentsPage: React.FC = () => {
  const { user } = useUser()
  if (!isAdmin(user)) {
    return <p>Forbidden</p>
  }
  const navigate = useNavigate()
  const [payments, setPayments] = useState<Payment[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetchPayments({ page, limit, signal: controller.signal })
      .then(({ payments, hasNext }) => {
        setPayments(payments)
        setHasNext(hasNext)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unknown error')
        }
      })
      .finally(() => {
        setLoading(false)
      })
    return () => {
      controller.abort()
    }
  }, [page])

  const handleViewDetails = (paymentId: string) => {
    navigate(`/payments/${paymentId}`)
  }

  return (
    <div className="payments-page">
      <h1>Payments</h1>
      <AdminNav />
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div>Loading payments...</div>
      ) : (
        <table className="payments-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.length > 0 ? (
              payments.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.userId}</td>
                  <td>
                    {p.amount.toFixed(2)} {p.currency.toUpperCase()}
                  </td>
                  <td>{p.status}</td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleViewDetails(p.id)}>View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || loading}
        >
          Previous
        </button>
        <span style={{ margin: '0 8px' }}>Page {page}</span>
        <button
          onClick={() => setPage(p => (hasNext ? p + 1 : p))}
          disabled={!hasNext || loading}
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default PaymentsPage
