import React, { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import FaintMindmapBackground from '../FaintMindmapBackground'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  }

  return (
    <section className="section relative overflow-hidden login-page">
      <FaintMindmapBackground />
      <div className="form-card">
        <h1 className="marketing-text-large mb-4 text-center">Welcome Back</h1>
        <p className="section-subtext mb-6 text-center">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="login-form">
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
          <button type="submit" className="btn w-full">Login</button>
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
