import React, { useState, FormEvent } from 'react'
import FaintMindmapBackground from './FaintMindmapBackground'

const ResetPasswordPage = () => {
  const [email, setEmail] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    window.alert(
      'If an account with that email exists, you will receive a password reset link.'
    )
    setEmail('')
  }

  return (
    <section className="section login-page relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="form-card text-center login-form">
        <img
          src="./assets/hero-mindmap.png"
          alt="Reset Password"
          className="login-icon banner-image"
        />
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <button type="submit" className="btn w-full">
            Send Reset Link
          </button>
        </form>
      </div>
    </section>
  )
}

export default ResetPasswordPage
