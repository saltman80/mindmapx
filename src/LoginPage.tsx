import React, { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FaintMindmapBackground from '../FaintMindmapBackground'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/.netlify/functions/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Login failed')
      }
      await res.json().catch(() => ({}))
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="section relative overflow-hidden login-page">
      <FaintMindmapBackground />
      <div className="form-card">
        <h1 className="marketing-text-large mb-4 text-center">Welcome Back</h1>
        <p className="section-subtext mb-6 text-center">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <p className="text-red-600 mb-4" role="alert">{error}</p>
          )}
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-field">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
            />
          </div>
          <button type="submit" className="btn w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
          <p className="mt-4 text-center">
            <Link to="/reset-password" className="text-blue-600 hover:underline">
              Reset Password
            </Link>
          </p>
        </form>
      </div>
    </section>
  )
}

export default LoginPage
