import { authFetch } from './authFetch'

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY
const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID

if (!STRIPE_PUBLIC_KEY || !PRICE_ID) {
  throw new Error(
    'Missing required Stripe environment variables VITE_STRIPE_PUBLIC_KEY or VITE_STRIPE_PRICE_ID.'
  )
}

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

const PaymentPage: React.FC = (): JSX.Element => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const res = await authFetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PRICE_ID }),
      })

      if (!res.ok) {
        let message = 'Failed to create checkout session.'
        try {
          const data = await res.json()
          if (data?.message && typeof data.message === 'string') {
            message = data.message
          }
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message)
      }

      const { sessionId, url } = await res.json()

      if (url) {
        window.location.assign(url)
        return
      }

      if (!sessionId) {
        throw new Error('Invalid session response.')
      }

      const stripe: Stripe | null = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to initialize.')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
      if (stripeError) {
        throw stripeError
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'An unexpected error occurred.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="payment-page container text-center p-lg">
      <h1 className="mb-md">Upgrade to Premium</h1>
      <p className="mb-lg">Unlock all features, priority support, and unlimited projects.</p>
      {error && <div className="text-error mb-md">{error}</div>}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="btn"
      >
        {loading ? 'Processing...' : 'Start Checkout'}
      </button>
    </div>
  )
}

export default PaymentPage