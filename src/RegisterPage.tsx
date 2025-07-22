import React, { useState, ChangeEvent, FormEvent, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FaintMindmapBackground from '../FaintMindmapBackground'
import MindmapArm from '../MindmapArm'

interface RegisterValues {
  name: string
  email: string
  password: string
}

const RegisterPage = (): JSX.Element => {
  const [values, setValues] = useState<RegisterValues>({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Partial<RegisterValues>>({})
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setLoading] = useState(false)
  const navigate = useNavigate()
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortControllerRef.current?.abort()
  }, [])

  const validate = (vals: RegisterValues): boolean => {
    const validationErrors: Partial<RegisterValues> = {}
    if (!vals.name) validationErrors.name = 'Name is required'
    if (!vals.email) {
      validationErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) {
      validationErrors.email = 'Invalid email address'
    }
    if (!vals.password) {
      validationErrors.password = 'Password is required'
    } else if (vals.password.length < 8) {
      validationErrors.password = 'Password must be at least 8 characters'
    }
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof RegisterValues]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    setSubmitError('')
    if (!validate(values)) return
    setLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller
    fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(values),
      signal: controller.signal
    })
      .then(async res => {
        if (!res.ok) {
          let msg = 'Registration failed'
          const ct = res.headers.get('Content-Type') || ''
          if (ct.includes('application/json')) {
            try {
              const data = await res.json()
              msg = data.error || msg
            } catch {}
          }
          throw new Error(msg)
        }
        return res.json()
      })
      .then(() => navigate('/dashboard'))
      .catch(err => {
        if ((err as any).name !== 'AbortError') {
          setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred')
        }
      })
      .finally(() => setLoading(false))
  }

  return (
    <section className="section login-page relative overflow-x-visible">
      <MindmapArm side="right" />
      <FaintMindmapBackground />
      <div className="form-card text-center login-form">
        <img src="./assets/hero-collaboration.png" alt="Register" className="login-icon banner-image" />
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        {submitError && (
          <div role="alert" aria-live="assertive" className="text-red-600 mb-4">
            {submitError}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={values.name}
              onChange={handleChange}
              className={`form-input${errors.name ? ' form-error' : ''}`}
              required
            />
            {errors.name && <p className="text-error text-sm mt-1">{errors.name}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              className={`form-input${errors.email ? ' form-error' : ''}`}
              required
            />
            {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
          </div>
          <div className="form-field">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              className={`form-input${errors.password ? ' form-error' : ''}`}
              required
              minLength={8}
            />
            {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="btn w-full">
            {isLoading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default RegisterPage
