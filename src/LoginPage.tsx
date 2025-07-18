import React, { useState, FormEvent } from 'react'
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
    <section className="section relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="max-w-sm w-full mx-auto bg-white p-6 rounded shadow text-center">
        <h1 className="marketing-text-large mb-4">Welcome Back</h1>
        <p className="section-subtext mb-6">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-left mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-left mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <button type="submit" className="btn w-full">
            Login
          </button>
        </form>
      </div>
    </section>
  )
}

export default LoginPage
