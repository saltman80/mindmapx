import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import FaintMindmapBackground from './FaintMindmapBackground'

export default function TrialRegister() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Valid email required.')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return false
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json().catch(() => null)
      if (res.status === 201) {
        navigate('/login')
        return
      }
      if (res.status === 409) {
        setError('Account already exists. Please log in.')
      } else {
        setError(data?.error || 'Failed to register.')
      }
    } catch {
      setError('Failed to register.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section login-page relative overflow-x-visible">
      <FaintMindmapBackground />
      <div className="form-card text-center login-form">
        <h2 className="text-2xl font-bold mb-6 text-center">Free 3-Day Trial</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="confirm" className="form-label">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              className="form-input"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn w-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </section>
  )
}
