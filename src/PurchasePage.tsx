import React from 'react'
import FaintMindmapBackground from '../FaintMindmapBackground'

const PurchasePage = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <section className="section relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="container text-center">
        <h1 className="mb-md">Purchase MindXdo</h1>
        <p className="mb-lg">$9.99 per month - Mindmap and Todo platform</p>
        <div className="form-card">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">
                Name
                <input
                  type="text"
                  placeholder="Your Name"
                  className="form-input"
                  required
                />
              </label>
            </div>
            <div className="form-field">
              <label className="form-label">
                Email
                <input
                  type="email"
                  placeholder="Your Email"
                  className="form-input"
                  required
                />
              </label>
            </div>
            <div className="form-field">
              <label className="form-label">
                Card Number
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  className="form-input"
                  required
                />
              </label>
            </div>
            <div className="form-field">
              <label className="form-label">
                Expiration
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="form-input"
                  required
                />
              </label>
            </div>
            <div className="form-field">
              <label className="form-label">
                CVC
                <input
                  type="text"
                  placeholder="123"
                  className="form-input"
                  required
                />
              </label>
            </div>
            <div className="payment-actions">
              <button type="submit" className="btn" disabled>
                Place Order
              </button>
              <button type="button" className="btn btn-paypal">PayPal</button>
            </div>
          </form>
        </div>
        <h2 className="mt-xl mb-md">Monthly Service Includes</h2>
        <table className="table-auto mx-auto text-left mb-lg">
          <thead>
            <tr>
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">Limit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2">Manual mindmaps &amp; todos</td>
              <td className="border px-4 py-2">Unlimited</td>
            </tr>
            <tr>
              <td className="border px-4 py-2">AI mind maps</td>
              <td className="border px-4 py-2">20 / month</td>
            </tr>
            <tr>
              <td className="border px-4 py-2">AI todo lists</td>
              <td className="border px-4 py-2">200 / month</td>
            </tr>
            <tr>
              <td className="border px-4 py-2">Kanban board</td>
              <td className="border px-4 py-2">Coming soon</td>
            </tr>
            <tr>
              <td className="border px-4 py-2">Team members</td>
              <td className="border px-4 py-2">3 seats</td>
            </tr>
          </tbody>
        </table>
        <p className="mb-md">
          Need more AI credits?{' '}
          <a href="mailto:hey@mindxdo.com">hey@mindxdo.com</a>
        </p>
        <p>
          Mindmaps, todos and the kanban board can be created separately or
          together.
        </p>
      </div>
    </section>
  )
}

export default PurchasePage
