import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FaintMindmapBackground from './FaintMindmapBackground'

export default function SetPasswordPage(): JSX.Element {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const fromQuery = searchParams.get('email')
    const stored = localStorage.getItem('emailForPurchase')
    setEmail(fromQuery || stored || '')
  }, [searchParams])

  const validate = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return false
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must include upper, lower and a number.')
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
    try {
      const res = await fetch('/.netlify/functions/createAuth0User', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (res.status === 201) {
        navigate('/login')
        return
      }
      if (res.status === 409) {
        setError('Account already exists. Please log in.')
        return
      }
      setError('Failed to create account.')
    } catch {
      setError('Failed to create account.')
    }
  }

  return (
    <section className="section login-page relative overflow-x-visible">
      <FaintMindmapBackground />
      <div className="form-card text-center login-form">
        <h2 className="text-2xl font-bold mb-6 text-center">Set Password</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
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
          <button type="submit" className="btn w-full">Set Password</button>
        </form>
      </div>
    </section>
  )
}
