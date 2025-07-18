import { useState } from 'react'
import FaintMindmapBackground from './FaintMindmapBackground'

export default function CheckoutPage(): JSX.Element {
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <section className="section relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="container text-center">
        <h1 className="mb-lg">Checkout</h1>
        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input type="text" required />
          </label>
          <label>
            Card Number
            <input type="text" required />
          </label>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Processing...' : 'Submit Payment'}
          </button>
        </form>
      </div>
    </section>
  )
}
