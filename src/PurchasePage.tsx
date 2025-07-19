import React from 'react'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'

const PurchasePage = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <section className="section relative overflow-x-visible">
      <div className="container">
        <h1 className="text-center mb-md">Purchase MindXdo</h1>
        <p className="text-center mb-lg">$9.99 per month - Mindmap and Todo platform</p>
        <div className="two-column purchase-grid">
          <div className="relative">
            <div className="offer-card text-center">
              <FaintMindmapBackground className="mindmap-bg-small" />
              <h2 className="mb-md">Monthly Service Includes</h2>
              <div className="features-grid mb-lg">
                <div className="feature-name">Manual mindmaps &amp; todos</div>
                <div className="feature-limit">Unlimited</div>
                <div className="feature-name">AI mind maps</div>
                <div className="feature-limit">20 / month</div>
                <div className="feature-name">AI todo lists</div>
                <div className="feature-limit">200 / month</div>
                <div className="feature-name">Kanban board</div>
                <div className="feature-limit">50 / unlimited cards</div>
                <div className="feature-name">Team members</div>
                <div className="feature-limit">3 seats</div>
              </div>
              <p className="mb-md">
                Need more AI credits?{' '}
                <a href="mailto:hey@mindxdo.com">hey@mindxdo.com</a>
              </p>
              <p>
                Mindmaps, todos and the kanban board can be created separately or together.
              </p>
            </div>
            <MindmapArm side="left" />
          </div>
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
            <p className="total-charge text-center">Total: $9.99 / month</p>
            <div className="payment-actions">
              <button type="submit" className="btn" disabled>
                Place Order
              </button>
              <button type="button" className="btn btn-paypal">PayPal</button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </section>
  )
}

export default PurchasePage
